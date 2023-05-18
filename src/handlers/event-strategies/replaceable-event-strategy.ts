import { IWebSocketAdapter } from '../../@types/adapters.ts'
import { Event } from '../../@types/event.ts'
import { IEventStrategy } from '../../@types/message-handlers.ts'
import { IEventRepository } from '../../@types/repositories.ts'
import { WebSocketAdapterEvent } from '../../constants/adapter.ts'
import { createLogger } from '../../factories/logger-factory.ts'
import { createCommandResult } from '../../utils/messages.ts'

const debug = createLogger('replaceable-event-strategy')

export class ReplaceableEventStrategy implements IEventStrategy<Event, Promise<void>> {
    public constructor(
        private readonly webSocket: IWebSocketAdapter,
        private readonly eventRepository: IEventRepository,
    ) {}

    public async execute(event: Event): Promise<void> {
        debug('received replaceable event: %o', event)
        try {
            const count = await this.eventRepository.upsert(event)
            this.webSocket.emit(
                WebSocketAdapterEvent.Message,
                createCommandResult(event.id, true, (count) ? '' : 'duplicate:'),
            )
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (
                    error.message.endsWith(
                        'duplicate key value violates unique constraint "events_event_id_unique"',
                    )
                ) {
                    this.webSocket.emit(
                        WebSocketAdapterEvent.Message,
                        createCommandResult(
                            event.id,
                            false,
                            'rejected: event already exists',
                        ),
                    )
                    return
                }

                this.webSocket.emit(
                    WebSocketAdapterEvent.Message,
                    createCommandResult(event.id, false, 'error: '),
                )
            }
        }
    }
}
