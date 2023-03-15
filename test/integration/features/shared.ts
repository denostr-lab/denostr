import { After, AfterAll, Before, BeforeAll, Given, Then, When, World } from '@cucumber/cucumber'
import { Buffer } from 'Buffer'
import { assocPath, pipe } from 'ramda'
import { fromEvent, map, Observable, ReplaySubject, Subject, takeUntil } from 'rxjs'
import Sinon from 'sinon'

import { DatabaseClient } from '../../../src/@types/base.ts'
import { CacheClient } from '../../../src/@types/cache.ts'
import { Event } from '../../../src/@types/event.ts'
import { AppWorker } from '../../../src/app/worker.ts'
import { getCacheClient } from '../../../src/cache/client.ts'
import Config from '../../../src/config/index.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../../../src/database/client.ts'
import { workerFactory } from '../../../src/factories/worker-factory.ts'
import { SettingsStatic } from '../../../src/utils/settings.ts'
import { connect, createIdentity, createSubscription, sendEvent } from './helpers.ts'

export const isDraft = Symbol('draft')

let worker: AppWorker

let dbClient: DatabaseClient
let rrDbClient: DatabaseClient
let cacheClient: CacheClient

export const streams = new WeakMap<WebSocket, Observable<unknown>>()

BeforeAll({ timeout: 1000 }, async function () {
    Config.RELAY_PORT = '18808'
    cacheClient = await getCacheClient()
    dbClient = getMasterDbClient()
    rrDbClient = getReadReplicaDbClient()
    await dbClient.raw('SELECT 1=1')
    Sinon.stub(SettingsStatic, 'watchSettings')
    const settings = SettingsStatic.createSettings()

    SettingsStatic._settings = pipe(
        assocPath(['limits', 'event', 'createdAt', 'maxPositiveDelta'], 0),
        assocPath(['limits', 'message', 'rateLimits'], []),
        assocPath(['limits', 'event', 'rateLimits'], []),
        assocPath(['limits', 'invoice', 'rateLimits'], []),
        assocPath(['limits', 'connection', 'rateLimits'], []),
    )(settings) as any

    worker = workerFactory()
    worker.run()
})

AfterAll(async function () {
    worker.close(async () => {
        await Promise.all([
            cacheClient.close(),
            dbClient.destroy(),
            rrDbClient.destroy(),
        ])
    })
})

Before(function () {
    this.parameters.identities = {}
    this.parameters.subscriptions = {}
    this.parameters.clients = {}
    this.parameters.events = {}
})

After(async function () {
    this.parameters.events = {}
    this.parameters.subscriptions = {}
    for (
        const ws of Object.values(
            this.parameters.clients as Record<string, WebSocket>,
        )
    ) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close()
        }
    }
    this.parameters.clients = {}

    const dbClient = getMasterDbClient()

    await dbClient('events')
        .where({
            event_pubkey: Object
                .values(
                    this.parameters.identities as Record<string, { pubkey: string }>,
                )
                .map(({ pubkey }) => Buffer.from(pubkey, 'hex')),
        }).del()
    this.parameters.identities = {}
})

Given(/someone called (\w+)/, async function (name: string) {
    const connection = await connect(name)
    this.parameters.identities[name] = this.parameters.identities[name] ??
        createIdentity(name)
    this.parameters.clients[name] = connection
    this.parameters.subscriptions[name] = []
    this.parameters.events[name] = []
    const subject = new Subject()
    connection.onclose = subject.next.bind(subject)

    const project = (raw: MessageEvent) => JSON.parse(raw.data.toString('utf8'))

    const replaySubject = new ReplaySubject(2, 1000)

    fromEvent(connection, 'message').pipe(map(project) as any, takeUntil(subject))
        .subscribe(replaySubject)

    streams.set(
        connection,
        replaySubject,
    )
})

When(
    /(\w+) subscribes to author (\w+)$/,
    async function (this: World<Record<string, any>>, from: string, to: string) {
        const ws = this.parameters.clients[from] as WebSocket
        const pubkey = this.parameters.identities[to].pubkey
        const subscription = {
            name: `test-${Math.random()}`,
            filters: [{ authors: [pubkey] }],
        }
        this.parameters.subscriptions[from].push(subscription)

        await createSubscription(ws, subscription.name, subscription.filters)
    },
)

Then(/(\w+) unsubscribes from author \w+/, async function (from: string) {
    const ws = this.parameters.clients[from] as WebSocket
    const subscription = this.parameters.subscriptions[from].pop()
    return new Promise<void>((resolve, reject) => {
        ws.send(
            JSON.stringify(['CLOSE', subscription.name]),
            (err) => err ? reject(err) : resolve(),
        )
    })
})

Then(
    /^(\w+) sends their last draft event (successfully|unsuccessfully)$/,
    async function (
        name: string,
        successfullyOrNot: string,
    ) {
        const ws = this.parameters.clients[name] as WebSocket

        const event = this.parameters.events[name].findLast((event: Event) => event[isDraft])

        delete event[isDraft]

        await sendEvent(ws, event, (successfullyOrNot) === 'successfully')
    },
)
