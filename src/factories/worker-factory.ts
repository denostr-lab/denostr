import { WebSocketServerAdapter } from '../adapters/web-socket-server-adapter.ts'
import { AppWorker } from '../app/worker.ts'
import { api, LocalBroker, WebSocketServerService } from '../core-services/index.ts'
import { createSettings } from '../factories/settings-factory.ts'
import { EventRepository } from '../repositories/event-repository.ts'
import { UserRepository } from '../repositories/user-repository.ts'
import { createWebApp } from './web-app-factory.ts'
import { webSocketAdapterFactory } from './websocket-adapter-factory.ts'

export const workerFactory = (): AppWorker => {
    const eventRepository = new EventRepository(createSettings)
    const userRepository = new UserRepository(createSettings)
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
