import { ChangeStreamDocument } from 'mongodb'
import mongoose from 'mongoose'

import type { EventSignatures } from '../core-services/index.ts'
import { DatabaseWatcher } from './DatabaseWatcher.ts'
import type { DBEvent } from '../@types/event.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { collectionName as eventsCollection } from './models/Events.ts'

export type Watcher = <T extends mongoose.Document>(
    model: mongoose.Model<T>,
    fn: (event: ChangeStreamDocument<T>) => void | Promise<void>,
) => void

export type ClientAction = 'inserted' | 'updated' | 'removed'

export type BroadcastCallback = <T extends keyof EventSignatures>(
    event: T,
    ...args: Parameters<EventSignatures[T]>
) => Promise<void>

const debug = createLogger('watchers:on')

export function initWatchers(
    watcher: DatabaseWatcher,
    broadcast: BroadcastCallback,
): void {
    watcher.on<DBEvent>(eventsCollection, (event) => {
        debug('events %o', event)

        const { clientAction, data, diff, id } = event
        broadcast('events.broadcast', { clientAction, data, diff, id })
    })
}
