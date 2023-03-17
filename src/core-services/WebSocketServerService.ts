import { WebSocketServerAdapter } from '../adapters/web-socket-server-adapter.ts'
import { WebSocketServerAdapterEvent } from '../constants/adapter.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { ServiceClass } from './index.ts'

const debug = createLogger('core-service:web-socket-server-service')

export class WebSocketServerService extends ServiceClass {
    protected name = 'instances'

    constructor(adapter: WebSocketServerAdapter) {
        super()

        this.onEvent('WebSocketServer.broadcast', (event) => {
            const { clientAction, data } = event
            if (clientAction === 'inserted') {
                debug('onEvent(WebSocketServer.broadcast) data: %o', data)
                adapter.emit(WebSocketServerAdapterEvent.Broadcast, data)
            }
        })
    }

    async started(): Promise<void> {
        debug('started')
    }
}
