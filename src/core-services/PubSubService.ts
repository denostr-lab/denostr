import { createLogger } from '@/factories/logger-factory.ts'
import { ServiceClass } from '@/core-services/index.ts'
import { CacheClient } from '@/@types/cache.ts'
import { PubSubBroadcastEvent } from '@/constants/adapter.ts'
import { ObjectId } from 'mongodb'
import { toDBEvent } from '@/utils/event.ts'

const debug = createLogger('core-service:pub-sub-service')

export class PubSubService extends ServiceClass {
    protected name = 'PubSubService'

    constructor(private getCacheClient: () => Promise<CacheClient>) {
        super()

        this.subscribe()
    }

    async subscribe() {
        const client = await this.getCacheClient()
        const sub = await client.subscribe(PubSubBroadcastEvent.Ephemeral)
        for await (const data of sub.receive()) {
            const { channel, message } = data
            if (channel === PubSubBroadcastEvent.Ephemeral) {
                try {
                    const event = toDBEvent(JSON.parse(message))
                    debug('parse event to %o', event)
                    // fake event id
                    event._id = new ObjectId()
                    this.emit('events.broadcast', {
                        clientAction: 'inserted',
                        data: event,
                        id: event._id,
                    })
                } catch (err) {
                    console.log('pub-sub-service: A possible weird string. Error:', err)
                }
            }
        }
    }

    async started(): Promise<void> {
        debug('started')
    }
}
