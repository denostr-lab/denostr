import { WebSocketServerAdapter } from '../adapters/web-socket-server-adapter.ts'
import { WebSocketServerAdapterEvent } from '../constants/adapter.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { ServiceClass } from './index.ts'
import { toNostrEvent } from '../utils/event.ts'
import { IEvent } from '../database/types/IEvent.ts'

const debug = createLogger('core-service:web-socket-server-service')

export class WebSocketServerService extends ServiceClass {
    protected name = 'instances'

    constructor(adapter: WebSocketServerAdapter) {
        super()

        this.onEvent('WebSocketServer.broadcast', (event) => {
            const { clientAction, data } = event
            if (clientAction === 'inserted') {
                debug('WebSocketServer.broadcast %s data: %o', clientAction, data)
                if (data && typeof data !== 'undefined') {
                    adapter.emit(WebSocketServerAdapterEvent.Broadcast, toNostrEvent(data as IEvent))
                }
            }
        })
    }

    async started(): Promise<void> {
        debug('started')
    }
}
