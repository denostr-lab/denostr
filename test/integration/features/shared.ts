// deno-lint-ignore-file
import { Buffer } from 'Buffer'
import fs from 'fs'

import { assocPath, pipe } from 'ramda'
import { fromEvent, map, Observable, ReplaySubject, Subject, takeUntil } from 'rxjs'
import Sinon from 'sinon'
import { afterAll, beforeAll, describe, it } from 'jest'
import { DatabaseClient } from '../../../src/@types/base.ts'
import { Event } from '../../../src/@types/event.ts'
import { AppWorker } from '../../../src/app/worker.ts'
import Config from '../../../src/config/index.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../../../src/database/client.ts'
import { workerFactory } from '../../../src/factories/worker-factory.ts'
import { SettingsStatic } from '../../../src/utils/settings.ts'
import type { IWorld } from './types.ts'
import { connect, createIdentity, createSubscription, sendEvent, WebSocketWrapper } from './helpers.ts'
import { masterEventsModel } from '../../../src/database/models/Events.ts'
import { api } from '../../../src/core-services/index.ts'
import { DatabaseWatcher } from '../../../src/database/DatabaseWatcher.ts'
import { initWatchers } from '../../../src/database/watchers.ts'

export const isDraft = Symbol('draft')

const World: IWorld = {
    parameters: {
        identities: {},
    },
    functions: {
        Given: [],
        When: [],
        Then: [],
    },
}
export const Given = (reg: RegExp, func: Function) => {
    World.functions.Given.push({ reg, func })
}
export const When = (reg: RegExp, func: Function) => {
    World.functions.When.push({ reg, func })
}

export const Then = (reg: RegExp, func: Function) => {
    World.functions.Then.push({ reg, func })
}

let worker: AppWorker

let dbClient: DatabaseClient
let rrDbClient: DatabaseClient
let watcher: DatabaseWatcher

export const streams = new WeakMap<WebSocketWrapper, Observable<unknown>>()

export const startTest = async (pathUrl: string, registerEvent: Function) => {
    pathUrl = new URL(pathUrl).pathname
    const testDesc = pathUrl.replace(Deno.cwd(), '')
    const featPath: string = pathUrl.replace('.ts', '')
    describe({
        name: testDesc,
        fn: async () => {
            beforeAll(async function () {
                World.functions = {
                    Given: [],
                    When: [],
                    Then: [],
                }

                registerEvent?.()

                Given(/someone called (\w+)/, async function (this: IWorld, name: string) {
                    const connection = await connect(name)
                    World.parameters.identities[name] = World.parameters.identities[name] ??
                        createIdentity(name)

                    World.parameters.clients[name] = connection
                    World.parameters.subscriptions[name] = []
                    World.parameters.events[name] = []

                    const close = new Subject()
                    connection.once('close', close.next.bind(close))
                    const projection = (raw: MessageEvent) => JSON.parse(raw.data.toString('utf8'))
                    const replaySubject = new ReplaySubject(2, 1000)
                    fromEvent(connection, 'message').pipe(map(projection) as any, takeUntil(close))
                        .subscribe(replaySubject)
                    streams.set(
                        connection,
                        replaySubject,
                    )
                })

                When(
                    /(\w+) subscribes to author (\w+)$/,
                    async function (this: IWorld, from: string, to: string) {
                        const ws = World.parameters.clients[from] as WebSocketWrapper
                        const pubkey = World.parameters.identities[to].pubkey
                        const subscription = {
                            name: `test-${Math.random()}`,
                            filters: [{ authors: [pubkey] }],
                        }
                        World.parameters.subscriptions[from].push(subscription)

                        await createSubscription(ws, subscription.name, subscription.filters)
                    },
                )

                Then(/(\w+) unsubscribes from author \w+/, async function (this: IWorld, from: string) {
                    const ws = World.parameters.clients[from] as WebSocketWrapper
                    const subscription = World.parameters.subscriptions[from].pop()
                    return new Promise<void>((resolve, reject) => {
                        ws.send(
                            JSON.stringify(['CLOSE', subscription.name]),
                        )
                        resolve()
                    })
                })

                Then(
                    /^(\w+) sends their last draft event (successfully|unsuccessfully)$/,
                    async function (
                        this: IWorld,
                        name: string,
                        successfullyOrNot: string,
                    ) {
                        const ws = World.parameters.clients[name] as WebSocketWrapper

                        const event = World.parameters.events[name].findLast((event: Event) => event[isDraft])

                        delete event[isDraft]

                        await sendEvent(ws, event, (successfullyOrNot) === 'successfully')
                    },
                )
                dbClient = getMasterDbClient()
                dbClient = await dbClient.asPromise()
                Config.RELAY_PORT = '18808'
                Config.SECRET = Math.random().toString().repeat(6)

                rrDbClient = getReadReplicaDbClient()
                await rrDbClient.asPromise()

                watcher = new DatabaseWatcher({
                    db: dbClient.db,
                })
                watcher.watch().catch((err: Error) => {
                    console.error(err, 'Fatal error occurred when watching database')
                    Deno.exit(1)
                })

                initWatchers(watcher, api.broadcastLocal.bind(api))

                Sinon.stub(SettingsStatic, 'watchSettings')
                const settings = SettingsStatic.createSettings()

                SettingsStatic._settings = pipe(
                    assocPath(['payments', 'enabled'], false),
                    assocPath(['limits', 'event', 'createdAt', 'maxPositiveDelta'], 0),
                    assocPath(['limits', 'message', 'rateLimits'], []),
                    assocPath(['limits', 'event', 'rateLimits'], []),
                    assocPath(['limits', 'invoice', 'rateLimits'], []),
                    assocPath(['limits', 'connection', 'rateLimits'], []),
                )(settings) as any

                worker = workerFactory()
                worker.run()
            })
            afterAll(async function () {
                worker.close(async () => {
                    try {
                        await watcher.close()
                        await Promise.all([
                            dbClient.destroy(true),
                            rrDbClient.destroy(true),
                        ])
                    } catch (e) {
                        console.info(e, 'close error')
                    }
                })
            })

            const defaultSettingsFileContent = fs.readFileSync(featPath, {
                encoding: 'utf-8',
            })

            const contentList = defaultSettingsFileContent.split('\n').slice(1)
            let scenarioList = []
            let currentList: string[] = []
            for (let line of contentList) {
                line = line.trim()
                if (!line) continue
                if (line.startsWith('Scenario:')) {
                    currentList = []
                    scenarioList.push({ list: currentList, line })
                } else {
                    currentList.push(line)
                }
            }
            for (let scenario of scenarioList) {
                let desc = scenario.line.trim()
                describe(desc, () => {
                    beforeAll(async () => {
                        const names = ['Alice', 'Bob', 'Charlie']
                        await masterEventsModel.find({
                            event_pubkey: {
                                $in: names.map((name) => createIdentity(name))
                                    .map(({ pubkey }) => Buffer.from(pubkey, 'hex')),
                            },
                        }).deleteMany()
                        World.parameters.identities = {}
                        World.parameters.subscriptions = {}
                        World.parameters.clients = {}
                        World.parameters.events = {}
                        World.parameters.channels = []
                    })
                    afterAll(async function () {
                        World.parameters.events = {}
                        World.parameters.subscriptions = {}
                        for (
                            const ws of Object.values(
                                World.parameters.clients as Record<string, WebSocketWrapper>,
                            )
                        ) {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                                ws.close()
                            }
                        }
                        World.parameters.clients = {}

                        await masterEventsModel.find({
                            event_pubkey: {
                                $in: Object.values(World.parameters.identities as Record<string, { pubkey: string }>)
                                    .map(({ pubkey }) => Buffer.from(pubkey, 'hex')),
                            },
                        }).deleteMany()

                        World.parameters.identities = {}
                    })
                    const statuFunction = async (line: string, key: string, replaceAnd: boolean) => {
                        const regfuncList = World.functions[key]
                        for (const funObje of regfuncList) {
                            let matchLine = line
                            if (replaceAnd) {
                                matchLine = matchLine.replace('And', '').trim()
                            } else {
                                matchLine = line.replace(key, '').trim()
                            }
                            const matList = matchLine.match(funObje.reg)

                            if (matList?.[0]) {
                                await funObje.func.bind(World)(...matList.slice(1))
                                return matList?.[0]
                            }
                        }
                    }
                    it(`start task, ${desc}`, async () => {
                        for (let line of scenario.list) {
                            for (let key in World.functions) {
                                const res = await statuFunction(line, key, line.startsWith('And'))
                                if (res) {
                                    break
                                }
                            }
                        }
                    })
                })
            }
        },
        sanitizeResources: false,
        sanitizeOps: false,
    })
}
