import { expect } from 'chai'
import Sinon from 'sinon'

import { MessageType, UnsubscribeMessage } from '../../../src/@types/messages.ts'
import { IMessageHandler } from '../../../src/@types/message-handlers.ts'
import { IWebSocketAdapter } from '../../../src/@types/adapters.ts'
import { UnsubscribeMessageHandler } from '../../../src/handlers/unsubscribe-message-handler.ts'
import { WebSocketAdapterEvent } from '../../../src/constants/adapter.ts'

describe('UnsubscribeMessageHandler', () => {
  let handler: IMessageHandler
  let websocketAdapter: IWebSocketAdapter
  let emitStub: Sinon.SinonStub
  beforeEach(() => {
    emitStub = Sinon.stub()
    websocketAdapter = {
      emit: emitStub,
    } as any
    handler = new UnsubscribeMessageHandler(websocketAdapter)
  })

  describe('handleMessage()', () => {
    it('emits unsubscribe event with subscription Id', async () => {
      const message: UnsubscribeMessage = [MessageType.CLOSE, 'subscriptionId']
      await handler.handleMessage(message)

      expect(emitStub).to.have.been.calledOnceWithExactly(WebSocketAdapterEvent.Unsubscribe, 'subscriptionId')
    })
  })
})
