import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Sinon from 'sinon'

chai.use(chaiAsPromised)

import { DatabaseClient } from '../../../../src/@types/base.ts'
import { DefaultEventStrategy } from '../../../../src/handlers/event-strategies/default-event-strategy.ts'
import { Event } from '../../../../src/@types/event.ts'
import { EventRepository } from '../../../../src/repositories/event-repository.ts'
import { IEventRepository } from '../../../../src/@types/repositories.ts'
import { IEventStrategy } from '../../../../src/@types/message-handlers.ts'
import { IWebSocketAdapter } from '../../../../src/@types/adapters.ts'
import { MessageType } from '../../../../src/@types/messages.ts'
import { WebSocketAdapterEvent } from '../../../../src/constants/adapter.ts'

const { expect } = chai

describe('DefaultEventStrategy', () => {
  const event: Event = {
    id: 'id',
  } as any
  let webSocket: IWebSocketAdapter
  let eventRepository: IEventRepository

  let webSocketEmitStub: Sinon.SinonStub
  let eventRepositoryCreateStub: Sinon.SinonStub

  let strategy: IEventStrategy<Event, Promise<void>>

  let sandbox: Sinon.SinonSandbox

  beforeEach(() => {
    sandbox = Sinon.createSandbox()

    eventRepositoryCreateStub = sandbox.stub(EventRepository.prototype, 'create')

    webSocketEmitStub = sandbox.stub()
    webSocket = {
      emit: webSocketEmitStub,
    } as any
    const masterClient: DatabaseClient = {} as any
    const readReplicaClient: DatabaseClient = {} as any
    eventRepository = new EventRepository(masterClient, readReplicaClient)

    strategy = new DefaultEventStrategy(webSocket, eventRepository)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('execute', () => {
    it('creates event', async () => {
      await strategy.execute(event)

      expect(eventRepositoryCreateStub).to.have.been.calledOnceWithExactly(event)
    })

    it('broadcast event if event is created', async () => {
      eventRepositoryCreateStub.resolves(1)

      await strategy.execute(event)

      expect(eventRepositoryCreateStub).to.have.been.calledOnceWithExactly(event)
      expect(webSocketEmitStub).to.have.been.calledTwice
      expect(webSocketEmitStub).to.have.been.calledWithExactly(
        WebSocketAdapterEvent.Message,
        [MessageType.OK, 'id', true, '']
      )
      expect(webSocketEmitStub).to.have.been.calledWithExactly(
        WebSocketAdapterEvent.Broadcast,
        event
      )
    })

    it('does not broadcast event if event is duplicate', async () => {
      eventRepositoryCreateStub.resolves(0)

      await strategy.execute(event)

      expect(eventRepositoryCreateStub).to.have.been.calledOnceWithExactly(event)
      expect(webSocketEmitStub).to.have.been.calledOnceWithExactly(
        WebSocketAdapterEvent.Message,
        ['OK', 'id', true, 'duplicate:']
      )
    })

    it('rejects if unable to create event', async () => {
      const error = new Error()
      eventRepositoryCreateStub.rejects(error)

      await expect(strategy.execute(event)).to.eventually.be.rejectedWith(error)

      expect(eventRepositoryCreateStub).to.have.been.calledOnceWithExactly(event)
      expect(webSocketEmitStub).not.to.have.been.called
    })
  })
})
