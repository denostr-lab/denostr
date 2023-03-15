import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { afterEach, beforeEach, describe, it } from 'jest'
import Sinon from 'sinon'
import SinonChi from 'sinon-chai'

chai.use(chaiAsPromised)
chai.use(SinonChi)

import { IWebSocketAdapter } from '../../../../src/@types/adapters.ts'
import { DatabaseClient } from '../../../../src/@types/base.ts'
import { Event } from '../../../../src/@types/event.ts'
import { IEventStrategy } from '../../../../src/@types/message-handlers.ts'
import { MessageType } from '../../../../src/@types/messages.ts'
import { IEventRepository } from '../../../../src/@types/repositories.ts'
import { WebSocketAdapterEvent } from '../../../../src/constants/adapter.ts'
import { EventDeduplicationMetadataKey, EventTags } from '../../../../src/constants/base.ts'
import { ParameterizedReplaceableEventStrategy } from '../../../../src/handlers/event-strategies/parameterized-replaceable-event-strategy.ts'
import { EventRepository } from '../../../../src/repositories/event-repository.ts'

const { expect } = chai

describe('ParameterizedReplaceableEventStrategy', () => {
    const event: Event = {
        id: 'id',
        tags: [
            [EventTags.Deduplication, 'dedup'],
        ],
    } as any
    let webSocket: IWebSocketAdapter
    let eventRepository: IEventRepository

    let webSocketEmitStub: Sinon.SinonStub
    let eventRepositoryUpsertStub: Sinon.SinonStub

    let strategy: IEventStrategy<Event, Promise<void>>

    let sandbox: Sinon.SinonSandbox

    beforeEach(() => {
        sandbox = Sinon.createSandbox()

        eventRepositoryUpsertStub = sandbox.stub(
            EventRepository.prototype,
            'upsert',
        )

        webSocketEmitStub = sandbox.stub()
        webSocket = {
            emit: webSocketEmitStub,
        } as any
        const masterClient: DatabaseClient = {} as any
        const readReplicaClient: DatabaseClient = {} as any
        eventRepository = new EventRepository(masterClient, readReplicaClient)

        strategy = new ParameterizedReplaceableEventStrategy(
            webSocket,
            eventRepository,
        )
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('execute', () => {
        it('upserts event without d tag', async () => {
            event.tags = []
            await strategy.execute(event)

            expect(eventRepositoryUpsertStub).to.have.been.calledOnceWithExactly(
                event,
            )
            expect(eventRepositoryUpsertStub.firstCall.firstArg).to.have.property(
                EventDeduplicationMetadataKey,
            ).and.deep.equal([''])
        })

        it('upserts event with d tag and one string', async () => {
            event.tags = [[EventTags.Deduplication, 'one']]
            await strategy.execute(event)

            expect(eventRepositoryUpsertStub).to.have.been.calledOnceWithExactly(
                event,
            )
            expect(eventRepositoryUpsertStub.firstCall.firstArg).to.have.property(
                EventDeduplicationMetadataKey,
            ).and.deep.equal(['one'])
        })

        it('upserts event with d tag and two strings', async () => {
            event.tags = [[EventTags.Deduplication, 'one', 'two']]
            await strategy.execute(event)

            expect(eventRepositoryUpsertStub).to.have.been.calledOnceWithExactly(
                event,
            )
            expect(eventRepositoryUpsertStub.firstCall.firstArg).to.have.property(
                EventDeduplicationMetadataKey,
            ).and.deep.equal(['one', 'two'])
        })

        it('broadcast event if event is created', async () => {
            eventRepositoryUpsertStub.resolves(1)

            await strategy.execute(event)

            expect(eventRepositoryUpsertStub).to.have.been.calledOnceWithExactly(
                event,
            )
            expect(webSocketEmitStub).to.have.been.calledTwice
            expect(webSocketEmitStub).to.have.been.calledWithExactly(
                WebSocketAdapterEvent.Message,
                [MessageType.OK, 'id', true, ''],
            )
            expect(webSocketEmitStub).to.have.been.calledWithExactly(
                WebSocketAdapterEvent.Broadcast,
                event,
            )
        })

        it('does not broadcast event if event is duplicate', async () => {
            eventRepositoryUpsertStub.resolves(0)

            await strategy.execute(event)

            expect(webSocketEmitStub).to.have.been.calledOnceWithExactly(
                WebSocketAdapterEvent.Message,
                [MessageType.OK, 'id', true, 'duplicate:'],
            )
        })

        it('rejects if unable to upsert event', async () => {
            const error = new Error()
            eventRepositoryUpsertStub.rejects(error)

            await expect(strategy.execute(event)).to.eventually.be.rejectedWith(
                error,
            )

            expect(eventRepositoryUpsertStub).to.have.been.calledOnceWithExactly(
                event,
            )
            expect(webSocketEmitStub).not.to.have.been.called
        })
    })
})
