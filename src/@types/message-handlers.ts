import { IncomingMessage } from './messages.ts'

export interface IMessageHandler {
  handleMessage(message: IncomingMessage): Promise<void>
}

export interface IAbortable {
  abort(): void
}

export interface IEventStrategy<TInput, TOutput> {
  execute(args: TInput): TOutput
}
