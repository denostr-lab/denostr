import { ObjectId } from 'mongodb'

import type { DBEvent } from '../../@types/event.ts'
import type { RedisPubSubMessage } from 'redis'

export type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed'

export type EventSignatures = {
    'events.broadcast'(data: {
        clientAction: ClientAction
        data?: undefined | Partial<DBEvent>
        diff?: undefined | Record<string, any>
        id: ObjectId
    }): void
    'pubsub.broadcast'(data: RedisPubSubMessage<string>): void
}
