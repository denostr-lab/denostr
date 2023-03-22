/* eslint-disable @typescript-eslint/ban-ts-comment */
// deno-lint-ignore-file ban-ts-comment
import mongoose from 'npm:mongoose'

import { api, LocalBroker } from '../../core-services/index.ts'
import { InstanceStatusService } from '../../core-services/InstanceStatusService.ts'
import { DatabaseWatcher } from '../DatabaseWatcher.ts'
import { initWatchers } from '../watchers.ts'

async function run() {
    const mongoUri = Deno.env.get('MONGO_URI') as string

    const conn = mongoose.createConnection(mongoUri, {
        keepAlive: true,
    })
    conn.on('open', () => {
        console.log('Connected to database')
    })
    await conn.asPromise()

    const mongo = conn as mongoose.Connection
    const db = mongo.db
    // @ts-ignore
    const _oplogHandle = mongo?._oplogHandle
    const watcher = new DatabaseWatcher({
        db,
        _oplogHandle,
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

    const broker = new LocalBroker()
    broker.onBroadcast((eventName, ...args) => {
        console.log('broadcast', [{ eventName, args }])
    })

    api.registerService(new InstanceStatusService())
    api.setBroker(broker)
    api.start()
}

run()
