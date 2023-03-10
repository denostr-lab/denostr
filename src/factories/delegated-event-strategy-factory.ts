import { isDeleteEvent, isEphemeralEvent, isReplaceableEvent } from '../utils/event.ts'
import { DefaultEventStrategy } from '../handlers/event-strategies/default-event-strategy.ts'
import { EphemeralEventStrategy } from '../handlers/event-strategies/ephemeral-event-strategy.ts'
import { Event } from '../@types/event.ts'
import { Factory } from '../@types/base.ts'
import { IEventRepository } from '../@types/repositories.ts'
import { IEventStrategy } from '../@types/message-handlers.ts'
import { IWebSocketAdapter } from '../@types/adapters.ts'

export const delegatedEventStrategyFactory = (
  eventRepository: IEventRepository,
): Factory<IEventStrategy<Event, Promise<void>>, [Event, IWebSocketAdapter]> =>
  ([event, adapter]: [Event, IWebSocketAdapter]) => {
    if (isEphemeralEvent(event)) {
      return new EphemeralEventStrategy(adapter)
    } else if (isReplaceableEvent(event) || isDeleteEvent(event)) {
      return
    }

    return new DefaultEventStrategy(adapter, eventRepository)
  }
