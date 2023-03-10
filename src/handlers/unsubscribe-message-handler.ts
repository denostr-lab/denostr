import { IMessageHandler } from '../@types/message-handlers.ts'
import { IWebSocketAdapter } from '../@types/adapters.ts'
import { UnsubscribeMessage } from '../@types/messages.ts'
import { WebSocketAdapterEvent } from '../constants/adapter.ts'

export class UnsubscribeMessageHandler implements IMessageHandler {
  public constructor(
    private readonly webSocket: IWebSocketAdapter,
  ) { }

  public async handleMessage(message: UnsubscribeMessage): Promise<void> {
    this.webSocket.emit(WebSocketAdapterEvent.Unsubscribe, message[1])
  }
}
