import { WebSocketServerAdapter } from '../adapters/web-socket-server-adapter.ts'
import { AppWorker } from '../app/worker.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../database/client.ts'
import { createSettings } from '../factories/settings-factory.ts'
import { EventRepository } from '../repositories/event-repository.ts'
import { UserRepository } from '../repositories/user-repository.ts'
import { createWebApp } from './web-app-factory.ts'
import { webSocketAdapterFactory } from './websocket-adapter-factory.ts'

export const workerFactory = (): AppWorker => {
  const dbClient = getMasterDbClient()
  const readReplicaDbClient = getReadReplicaDbClient()
  const eventRepository = new EventRepository(dbClient, readReplicaDbClient)
  const userRepository = new UserRepository(dbClient)
  const server = createWebApp()
  console.log(`
  ███▄    █  ▒█████    ██████ ▄▄▄█████▓ ██▀███  ▓█████ ▄▄▄       ███▄ ▄███▓
  ██ ▀█   █ ▒██▒  ██▒▒██    ▒ ▓  ██▒ ▓▒▓██ ▒ ██▒▓█   ▀▒████▄    ▓██▒▀█▀ ██▒
 ▓██  ▀█ ██▒▒██░  ██▒░ ▓██▄   ▒ ▓██░ ▒░▓██ ░▄█ ▒▒███  ▒██  ▀█▄  ▓██    ▓██░
 ▓██▒  ▐▌██▒▒██   ██░  ▒   ██▒░ ▓██▓ ░ ▒██▀▀█▄  ▒▓█  ▄░██▄▄▄▄██ ▒██    ▒██
 ▒██░   ▓██░░ ████▓▒░▒██████▒▒  ▒██▒ ░ ░██▓ ▒██▒░▒████▒▓█   ▓██▒▒██▒   ░██▒
 ░ ▒░   ▒ ▒ ░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░  ▒ ░░   ░ ▒▓ ░▒▓░░░ ▒░ ░▒▒   ▓▒█░░ ▒░   ░  ░
 ░ ░░   ░ ▒░  ░ ▒ ▒░ ░ ░▒  ░ ░    ░      ░▒ ░ ▒░ ░ ░  ░ ▒   ▒▒ ░░  ░      ░
    ░   ░ ░ ░ ░ ░ ▒  ░  ░  ░    ░        ░░   ░    ░    ░   ▒   ░      ░
          ░     ░ ░        ░              ░        ░  ░     ░  ░       ░`)
  const adapter = new WebSocketServerAdapter(
    server,
    webSocketAdapterFactory(eventRepository, userRepository),
    createSettings,
  )
  return new AppWorker(adapter)
}
