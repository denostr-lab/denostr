import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { afterEach,beforeEach, describe, it } from 'jest'
import Sinon from 'sinon'

chai.use(chaiAsPromised)

import { IWebSocketAdapter } from '../../../../src/@types/adapters.ts'
import { Event } from '../../../../src/@types/event.ts'
import { IEventStrategy } from '../../../../src/@types/message-handlers.ts'
import { MessageType } from '../../../../src/@types/messages.ts'
import { WebSocketAdapterEvent } from '../../../../src/constants/adapter.ts'
import { EphemeralEventStrategy } from '../../../../src/handlers/event-strategies/ephemeral-event-strategy.ts'

const { expect } = chai

describe('EphemeralEventStrategy', () => {
  const event: Event = {} as any
  let webSocket: IWebSocketAdapter
  let strategy: IEventStrategy<Event, Promise<void>>
  let sandbox: Sinon.SinonSandbox

  let webSocketEmitStub: Sinon.SinonStub

  beforeEach(() => {
    sandbox = Sinon.createSandbox()

    webSocketEmitStub = sandbox.stub()
    webSocket = {
      emit: webSocketEmitStub,
    } as any

    strategy = new EphemeralEventStrategy(webSocket)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('execute', () => {
    it('broadcasts event', async () => {
      await strategy.execute(event)

      expect(webSocketEmitStub.firstCall).to.have.been.calledWithExactly(
        WebSocketAdapterEvent.Message,
        [
          MessageType.OK,
          event.id,
          true,
          '',
        ]
      )
      expect(webSocketEmitStub.secondCall).to.have.been.calledWithExactly(
        WebSocketAdapterEvent.Broadcast,
        event
      )
    })
  })
})
