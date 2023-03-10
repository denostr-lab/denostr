import { IncomingMessage } from 'node:http'
import { WebSocket } from 'ws'

import { IEventRepository, IUserRepository } from '../@types/repositories.ts'
import { createSettings } from './settings-factory.ts'
import { IWebSocketServerAdapter } from '../@types/adapters.ts'
import { messageHandlerFactory } from './message-handler-factory.ts'
import { slidingWindowRateLimiterFactory } from './rate-limiter-factory.ts'
import { WebSocketAdapter } from '../adapters/web-socket-adapter.ts'


export const webSocketAdapterFactory = (
  eventRepository: IEventRepository,
  userRepository: IUserRepository,
) => ([client, request, webSocketServerAdapter]: [WebSocket, IncomingMessage, IWebSocketServerAdapter]) =>
    new WebSocketAdapter(
      client,
      request,
      webSocketServerAdapter,
      messageHandlerFactory(eventRepository, userRepository),
      slidingWindowRateLimiterFactory,
      createSettings,
    )
