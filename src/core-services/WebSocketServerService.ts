import { WebSocketServerAdapter } from '../adapters/web-socket-server-adapter.ts'
import { WebSocketServerAdapterEvent } from '../constants/adapter.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { ServiceClass } from './index.ts'
import { toNostrEvent } from '../utils/event.ts'
import { DBEvent } from '../@types/event.ts'
import { readReplicaEventsModel } from '../database/models/Events.ts'

const debug = createLogger('core-service:web-socket-server-service')

export class WebSocketServerService extends ServiceClass {
    protected name = 'WebSocketServerService'

    constructor(adapter: WebSocketServerAdapter) {
        super()

        this.onEvent('events.broadcast', async (event) => {
            const { clientAction, data, diff, id } = event
            if (clientAction === 'inserted') {
                debug('events.broadcast %s data: %o', clientAction, data)
                if (data && typeof data !== 'undefined') {
                    // ignore draft
                    if (data?.event_signature?.toString() === '' || data?.deleted_at) {
                        return
                    }
                    adapter.emit(WebSocketServerAdapterEvent.Broadcast, toNostrEvent(data as DBEvent))
                }
            }

            if (clientAction === 'updated') {
                debug('events.broadcast %s diff: %o', clientAction, diff)
                const data = await readReplicaEventsModel.findById(id) as DBEvent | null
                if (data) {
                    adapter.emit(WebSocketServerAdapterEvent.Broadcast, toNostrEvent(data as DBEvent))
                }
            }
        })
    }

    async started(): Promise<void> {
        debug('started')
    }
}
