// deno-lint-ignore-file
import { Buffer } from 'Buffer'
import fs from 'node:fs'
import path from 'node:path'
import { assocPath, pipe } from 'ramda'
import { fromEvent, map, Observable, ReplaySubject, Subject, takeUntil } from 'npm:rxjs@7.8.0'
import Sinon from 'sinon'
import { afterAll, beforeAll, describe, it } from 'jest'

import { DatabaseClient } from '../../../src/@types/base.ts'
import { CacheClient } from '../../../src/@types/cache.ts'
import { Event } from '../../../src/@types/event.ts'
import { AppWorker } from '../../../src/app/worker.ts'
import { getCacheClient } from '../../../src/cache/client.ts'
import Config from '../../../src/config/index.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../../../src/database/client.ts'
import { workerFactory } from '../../../src/factories/worker-factory.ts'
import { SettingsStatic } from '../../../src/utils/settings.ts'
import { connect, createIdentity, createSubscription, sendEvent, WebSocketWrapper } from './helpers.ts'

export const isDraft = Symbol('draft')

type RegexFunc = {
    reg: RegExp
    func: Function
}
interface World {
    parameters: Record<string, any>
    functions: Record<string, RegexFunc[]>
}
export const World: World = {
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
let cacheClient: CacheClient

export const streams = new WeakMap<WebSocketWrapper, Observable<unknown>>()

export const startTest = (pathUrl: string) => {
    pathUrl = new URL(pathUrl).pathname
    const testDesc = pathUrl.replace(Deno.cwd(), '')
    const featPath: string = pathUrl.replace('.ts', '')
    Given(/someone called (\w+)/, async function (this: typeof World, name: string) {
        const connection = await connect(name)
        World.parameters.identities[name] = World.parameters.identities[name] ??
            createIdentity(name)
        World.parameters.clients[name] = connection
        World.parameters.subscriptions[name] = []
        World.parameters.events[name] = []
        const subject = new Subject()
        connection.once('close', subject.next.bind(subject))
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
        async function (this: typeof World, from: string, to: string) {
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

    Then(/(\w+) unsubscribes from author \w+/, async function (this: typeof World, from: string) {
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
            this: typeof World,
            name: string,
            successfullyOrNot: string,
        ) {
            const ws = World.parameters.clients[name] as WebSocketWrapper

            const event = World.parameters.events[name].findLast((event: Event) => event[isDraft])

            delete event[isDraft]

            await sendEvent(ws, event, (successfullyOrNot) === 'successfully')
        },
    )
    describe(testDesc, () => {
        beforeAll(async function () {
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
        afterAll(async function () {
            worker.close(async () => {
                await Promise.all([
                    cacheClient.close(),
                    dbClient.destroy(),
                    rrDbClient.destroy(),
                ])
            })
        })

        const defaultSettingsFileContent = fs.readFileSync(featPath, {
            encoding: 'utf-8',
        })

        const contentList = defaultSettingsFileContent.split('\n').slice(1)
        let scenarioList = []
        let prevKey = ''
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
                
                beforeAll(() => {
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

                    const dbClient = getMasterDbClient()

                    await dbClient('events')
                        .where({
                            event_pubkey: Object
                                .values(
                                    World.parameters.identities as Record<string, { pubkey: string }>,
                                )
                                .map(({ pubkey }) => Buffer.from(pubkey, 'hex')),
                        }).del()
                    World.parameters.identities = {}

                })
                const statuFunction = async(line: string, key: string)=> {
                    const regfuncList = World.functions[key]
                    for (const funObje of regfuncList) {
                        const matchLine = line.replace(key, '').trim()
                        const matList = matchLine.match(funObje.reg)
                        if (matList?.[0]) {
                            prevKey = key
                            await funObje.func.bind(World)(...matList.slice(1))
                            break
                        }
                    }
                }
                it(`start task, ${desc}`, async() => {
                    let hitGroup = false
                    for (let line of scenario.list) {
                        hitGroup = false
                        for (let key in World.functions) {
                            if (line.startsWith(key)) {
                                hitGroup = true
                                prevKey = key
                                await statuFunction(line, key)
                                break
                            }
                        }
                        if (!hitGroup && prevKey && line.startsWith('And')) {
                            await statuFunction(line, prevKey)
                        }
                    }
                })
            })
        }
    })
}
