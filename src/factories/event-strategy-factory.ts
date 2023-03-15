import { IWebSocketAdapter } from "../@types/adapters.ts";
import { Factory } from "../@types/base.ts";
import { Event } from "../@types/event.ts";
import { IEventStrategy } from "../@types/message-handlers.ts";
import { IEventRepository } from "../@types/repositories.ts";
import { DefaultEventStrategy } from "../handlers/event-strategies/default-event-strategy.ts";
import { DeleteEventStrategy } from "../handlers/event-strategies/delete-event-strategy.ts";
import { EphemeralEventStrategy } from "../handlers/event-strategies/ephemeral-event-strategy.ts";
import { ParameterizedReplaceableEventStrategy } from "../handlers/event-strategies/parameterized-replaceable-event-strategy.ts";
import { ReplaceableEventStrategy } from "../handlers/event-strategies/replaceable-event-strategy.ts";
import {
  isDeleteEvent,
  isEphemeralEvent,
  isParameterizedReplaceableEvent,
  isReplaceableEvent,
} from "../utils/event.ts";

export const eventStrategyFactory = (
  eventRepository: IEventRepository,
): Factory<IEventStrategy<Event, Promise<void>>, [Event, IWebSocketAdapter]> =>
([event, adapter]: [Event, IWebSocketAdapter]) => {
  if (isReplaceableEvent(event)) {
    return new ReplaceableEventStrategy(adapter, eventRepository);
  } else if (isEphemeralEvent(event)) {
    return new EphemeralEventStrategy(adapter);
  } else if (isDeleteEvent(event)) {
    return new DeleteEventStrategy(adapter, eventRepository);
  } else if (isParameterizedReplaceableEvent(event)) {
    return new ParameterizedReplaceableEventStrategy(adapter, eventRepository);
  }

  return new DefaultEventStrategy(adapter, eventRepository);
};
