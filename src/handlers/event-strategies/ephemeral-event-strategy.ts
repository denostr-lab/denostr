import { IWebSocketAdapter } from '../../@types/adapters.ts'
import { Event } from '../../@types/event.ts'
import { IEventStrategy } from '../../@types/message-handlers.ts'
import { WebSocketAdapterEvent } from '../../constants/adapter.ts'
import { createLogger } from '../../factories/logger-factory.ts'
import { createCommandResult } from '../../utils/messages.ts'
import { getCacheClient, publish } from '@/cache/client.ts'
import { PubSubBroadcastEvent } from '@/constants/adapter.ts'

const debug = createLogger('ephemeral-event-strategy')

export class EphemeralEventStrategy implements IEventStrategy<Event, Promise<void>> {
    public constructor(
        private readonly webSocket: IWebSocketAdapter,
    ) {}

    public async execute(event: Event): Promise<void> {
        debug('received ephemeral event: %o', event)
        this.webSocket.emit(
            WebSocketAdapterEvent.Message,
            createCommandResult(event.id, true, ''),
        )

        const client = await getCacheClient()
        if (client) {
            try {
                await publish(PubSubBroadcastEvent.Ephemeral, JSON.stringify(event))
            } catch {
                debug('failed to publish ephemeral event: %o', event)
            }
        } else {
            this.webSocket.emit(WebSocketAdapterEvent.Broadcast, event)
        }
    }
}
