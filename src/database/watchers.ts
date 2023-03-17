import { ChangeStreamDocument } from 'npm:mongodb'
import mongoose from 'npm:mongoose'

import type { EventSignatures } from '../core-services/index.ts'
import { DatabaseWatcher } from './DatabaseWatcher.ts'
import { EventsModel } from './models/index.ts'
import type { IEvent } from './types/index.ts'

export type Watcher = <T extends mongoose.Document>(
    model: mongoose.Model<T>,
    fn: (event: ChangeStreamDocument<T>) => void | Promise<void>,
) => void

export type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed'

export type BroadcastCallback = <T extends keyof EventSignatures>(
    event: T,
    ...args: Parameters<EventSignatures[T]>
) => Promise<void>

export function initWatchers(
    watcher: DatabaseWatcher,
    broadcast: BroadcastCallback,
): void {
    watcher.on<IEvent>(EventsModel.collection.collectionName, (event) => {
        // console.log('watcher.on<IEvent> event=', event)
        const { clientAction, data, diff, id } = event
        broadcast('WebSocketServer.broadcast', { clientAction, data, diff, id })
    })

    // watcher.on<IInstanceStatus>(
    //     InstanceStatusModel.collection.collectionName,
    //     (event) => {
    //         // console.log("watcher.on<InstanceStatusDocument> event=", event);
    //         const { clientAction, data, diff, id } = event

    //         broadcast('watch.instanceStatus', { clientAction, data, diff, id })
    //     },
    // )
}
