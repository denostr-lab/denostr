import { is, path, pathSatisfies } from 'ramda'
import http from 'node:http'
import process from 'node:process'

import { getMasterDbClient, getReadReplicaDbClient } from '../database/client.ts'
import { AppWorker } from '../app/worker.ts'
import { createSettings } from '../factories/settings-factory.ts'
import { createWebApp } from './web-app-factory.ts'
import { EventRepository } from '../repositories/event-repository.ts'
import { UserRepository } from '../repositories/user-repository.ts'
import { webSocketAdapterFactory } from './websocket-adapter-factory.ts'
import { WebSocketServerAdapter } from '../adapters/web-socket-server-adapter.ts'

import { WebSocketServer } from 'websocket'

export const workerFactory = (): AppWorker => {
  const dbClient = getMasterDbClient()
  const readReplicaDbClient = getReadReplicaDbClient()
  const eventRepository = new EventRepository(dbClient, readReplicaDbClient)
  const userRepository = new UserRepository(dbClient)

  const settings = createSettings()

  const app = createWebApp()

  // deepcode ignore HttpToHttps: we use proxies
  const server = http.createServer(app)

  // let maxPayloadSize: number | undefined
  // if (pathSatisfies(is(String), ['network', 'max_payload_size'], settings)) {
  //   console.warn(`WARNING: Setting network.max_payload_size is deprecated and will be removed in a future version.
  //       Use network.maxPayloadSize instead.`)
  //   maxPayloadSize = path(['network', 'max_payload_size'], settings)
  // } else {
  //   maxPayloadSize = path(['network', 'maxPayloadSize'], settings)
  // }
  const webSocketServer = new WebSocketServer(8008)
  const adapter = new WebSocketServerAdapter(
    server,
    webSocketServer,
    webSocketAdapterFactory(eventRepository, userRepository),
    createSettings,
  )
  return new AppWorker(process, adapter)
}
