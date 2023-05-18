import { IWebSocketAdapter } from '../../@types/adapters.ts'
import { Event } from '../../@types/event.ts'
import { IEventStrategy } from '../../@types/message-handlers.ts'
import { IEventRepository } from '../../@types/repositories.ts'
import { WebSocketAdapterEvent } from '../../constants/adapter.ts'
import { createLogger } from '../../factories/logger-factory.ts'
import { createCommandResult } from '../../utils/messages.ts'

const debug = createLogger('default-event-strategy')

export class DefaultEventStrategy implements IEventStrategy<Event, Promise<void>> {
    public constructor(
        private readonly webSocket: IWebSocketAdapter,
        private readonly eventRepository: IEventRepository,
    ) {}

    public async execute(event: Event): Promise<void> {
        debug('received event: %o', event)
        const count = await this.eventRepository.create(event)
        this.webSocket.emit(
            WebSocketAdapterEvent.Message,
            createCommandResult(event.id, true, (count) ? '' : 'duplicate:'),
        )
    }
}
