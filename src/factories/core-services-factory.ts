/* eslint-disable @typescript-eslint/ban-ts-comment */
// deno-lint-ignore-file ban-ts-comment
import { api } from '../core-services/index.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../database/client1.ts'
import { DatabaseWatcher } from '../database/DatabaseWatcher.ts'
import { initWatchers } from '../database/watchers.ts'

export let watcher: DatabaseWatcher

export const coreServicesFactory = async () => {
    const primaryConn = getMasterDbClient()
    await primaryConn.asPromise()

    const secondaryConn = getReadReplicaDbClient()
    await secondaryConn.asPromise()

    watcher = new DatabaseWatcher({
        db: primaryConn.db,
        // @ts-ignore
        _oplogHandle: primaryConn?._oplogHandle,
    })
    watcher.watch().catch((err: Error) => {
        console.error(err, 'Fatal error occurred when watching database')
        Deno.exit(1)
    })

    initWatchers(watcher, api.broadcastLocal.bind(api))

    setInterval(function _checkDatabaseWatcher() {
        if (watcher.isLastDocDelayed()) {
            console.error('No real time data received recently')
        }
    }, 20000)
}
