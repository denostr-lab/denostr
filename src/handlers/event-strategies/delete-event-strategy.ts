import { IWebSocketAdapter } from '../../@types/adapters.ts'
import { Tag } from '../../@types/base.ts'
import { Event } from '../../@types/event.ts'
import { IEventStrategy } from '../../@types/message-handlers.ts'
import { IEventRepository } from '../../@types/repositories.ts'
import { WebSocketAdapterEvent } from '../../constants/adapter.ts'
import { EventTags } from '../../constants/base.ts'
import { createLogger } from '../../factories/logger-factory.ts'
import { createCommandResult } from '../../utils/messages.ts'

const debug = createLogger('delete-event-strategy')

export class DeleteEventStrategy implements IEventStrategy<Event, Promise<void>> {
    public constructor(
        private readonly webSocket: IWebSocketAdapter,
        private readonly eventRepository: IEventRepository,
    ) {}

    public async execute(event: Event): Promise<void> {
        debug('received delete event: %o', event)

        const isValidETag = (tag: Tag) =>
            tag.length >= 2 &&
            tag[0] === EventTags.Event &&
            /^[0-9a-f]{64}$/.test(tag[1])

        const eventIdsToDelete = event.tags.reduce(
            (eventIds, tag) => isValidETag(tag) ? [...eventIds, tag[1]] : eventIds,
            [] as string[],
        )

        if (eventIdsToDelete.length) {
            const count = await this.eventRepository.deleteByPubkeyAndIds(
                event.pubkey,
                eventIdsToDelete,
            )
            if (!count) {
                await this.eventRepository.insertStubs(
                    event.pubkey,
                    eventIdsToDelete,
                )
            }
        }

        const count = await this.eventRepository.create(event)
        this.webSocket.emit(
            WebSocketAdapterEvent.Message,
            createCommandResult(event.id, true, (count) ? '' : 'duplicate:'),
        )
    }
}
