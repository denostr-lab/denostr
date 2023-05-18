/* eslint-disable @typescript-eslint/ban-ts-comment */
import { api } from '../core-services/index.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../database/client.ts'
import { DatabaseWatcher } from '../database/DatabaseWatcher.ts'
import { initWatchers } from '../database/watchers.ts'

// export let watcher: DatabaseWatcher

export const coreServicesFactory = async () => {
    const primaryConn = getMasterDbClient()
    await primaryConn.asPromise()

    const secondaryConn = getReadReplicaDbClient()
    await secondaryConn.asPromise()

    const watcher = new DatabaseWatcher({
        db: primaryConn.db,
    })
    watcher.watch().catch((err: Error) => {
        console.error(err, 'Fatal error occurred when watching database')
        Deno.exit(1)
    })

    initWatchers(watcher, api.broadcastLocal.bind(api))
}
