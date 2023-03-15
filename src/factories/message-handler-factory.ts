import { IWebSocketAdapter } from "../@types/adapters.ts";
import { IncomingMessage, MessageType } from "../@types/messages.ts";
import { IEventRepository, IUserRepository } from "../@types/repositories.ts";
import { DelegatedEventMessageHandler } from "../handlers/delegated-event-message-handler.ts";
import { EventMessageHandler } from "../handlers/event-message-handler.ts";
import { SubscribeMessageHandler } from "../handlers/subscribe-message-handler.ts";
import { UnsubscribeMessageHandler } from "../handlers/unsubscribe-message-handler.ts";
import { isDelegatedEvent } from "../utils/event.ts";
import { delegatedEventStrategyFactory } from "./delegated-event-strategy-factory.ts";
import { eventStrategyFactory } from "./event-strategy-factory.ts";
import { slidingWindowRateLimiterFactory } from "./rate-limiter-factory.ts";
import { createSettings } from "./settings-factory.ts";

export const messageHandlerFactory = (
  eventRepository: IEventRepository,
  userRepository: IUserRepository,
) =>
([message, adapter]: [IncomingMessage, IWebSocketAdapter]) => {
  switch (message[0]) {
    case MessageType.EVENT: {
      if (isDelegatedEvent(message[1])) {
        return new DelegatedEventMessageHandler(
          adapter,
          delegatedEventStrategyFactory(eventRepository),
          userRepository,
          createSettings,
          slidingWindowRateLimiterFactory,
        );
      }

      return new EventMessageHandler(
        adapter,
        eventStrategyFactory(eventRepository),
        userRepository,
        createSettings,
        slidingWindowRateLimiterFactory,
      );
    }
    case MessageType.REQ:
      return new SubscribeMessageHandler(
        adapter,
        eventRepository,
        createSettings,
      );
    case MessageType.CLOSE:
      return new UnsubscribeMessageHandler(adapter);
    default:
      throw new Error(
        `Unknown message type: ${String(message[0]).substring(0, 64)}`,
      );
  }
};
