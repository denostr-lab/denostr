import { WebSocketServerAdapter } from '../adapters/web-socket-server-adapter.ts'
import { AppWorker } from '../app/worker.ts'
import { api, LocalBroker, WebSocketServerService } from '../core-services/index.ts'
import { getMasterDbClient } from '../database/client.ts'
import { createSettings } from '../factories/settings-factory.ts'
import { EventRepository } from '../repositories/event-repository.ts'
import { UserRepository } from '../repositories/user-repository.ts'
import { createWebApp } from './web-app-factory.ts'
import { webSocketAdapterFactory } from './websocket-adapter-factory.ts'

export const workerFactory = (): AppWorker => {
    const dbClient = getMasterDbClient()
    const eventRepository = new EventRepository()
    const userRepository = new UserRepository(dbClient)
    const server = createWebApp()
    console.log(`
    ██████╗ ███████╗███╗   ██╗ ██████╗ ███████╗████████╗██████╗ 
    ██╔══██╗██╔════╝████╗  ██║██╔═══██╗██╔════╝╚══██╔══╝██╔══██╗
    ██║  ██║█████╗  ██╔██╗ ██║██║   ██║███████╗   ██║   ██████╔╝
    ██║  ██║██╔══╝  ██║╚██╗██║██║   ██║╚════██║   ██║   ██╔══██╗
    ██████╔╝███████╗██║ ╚████║╚██████╔╝███████║   ██║   ██║  ██║
    ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝
                                                                
    `)
    const adapter = new WebSocketServerAdapter(
        server,
        webSocketAdapterFactory(eventRepository, userRepository),
        createSettings,
    )

    api.registerService(new WebSocketServerService(adapter))
    const broker = new LocalBroker()
    broker.onBroadcast((eventName, ...args) => {
        // TODO
        console.log('broadcast', [{ eventName, args }])
    })
    api.setBroker(broker)
    api.start()

    return new AppWorker(adapter)
}
