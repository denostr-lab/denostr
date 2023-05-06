import { Buffer } from 'Buffer'
import { createHash, createHmac } from 'crypto'
import { EventEmitter } from 'node:events'

import { Observable } from 'npm:rxjs@7.8.0'
import * as secp256k1 from 'secp256k1'

import { Event } from '../../../src/@types/event.ts'
import { CommandResult, MessageType, OutgoingMessage } from '../../../src/@types/messages.ts'
import { SubscriptionFilter } from '../../../src/@types/subscription.ts'
import { serializeEvent } from '../../../src/utils/event.ts'
import { streams } from './shared.ts'
import type { IWebSocketWrapper } from './types.ts'
// secp256k1.utils.sha256Sync = (...messages: Uint8Array[]) =>
//   messages.reduce((hash, message: Uint8Array) => hash.update(message),  createHash('sha256')).digest()

export class WebSocketWrapper extends EventEmitter implements IWebSocketWrapper {
    private host: string
    public readyState: number
    private ws: WebSocket | undefined

    constructor(host: string) {
        super()
        this.readyState = WebSocket.CONNECTING
        this.host = host
        this.initSocket()
    }
    public close() {
        this.ws?.close()
        this.ws = undefined
        this.removeAllListeners()
    }
    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        this.ws?.send(data)
    }
    private initSocket() {
        this.ws = new WebSocket(this.host)
        this.ws.onopen = (e) => {
            this.readyState = WebSocket.OPEN
            this.emit('open', e)
        }
        this.ws.onmessage = (e) => {
            this.emit('message', e)
        }
        this.ws.onerror = (e) => {
            this.readyState = WebSocket.CLOSED
            this.emit('error', e)
        }
        this.ws.onclose = (e) => {
            this.readyState = WebSocket.CLOSED
            this.emit('close', e)
        }
    }
}
export async function connect(_name: string): Promise<WebSocketWrapper> {
    return new Promise<WebSocketWrapper>((resolve, reject) => {
        try {
            const host = 'ws://localhost:18808'
            const ws = new WebSocketWrapper(host)
            ws.once('open', () => {
                resolve(ws)
            })
            ws.once('error', () => {
                reject(null)
            })
        } catch (e) {
            console.info(e, 'inie socket error')
        }
    })
}

let eventCount = 0

export async function createEvent(
    input: Partial<Event>,
    privkey: any,
): Promise<Event> {
    const event: Event = {
        pubkey: input.pubkey,
        kind: input.kind,
        created_at: input.created_at ??
            Math.floor(Date.now() / 1000) + eventCount++,
        content: input.content ?? '',
        tags: input.tags ?? [],
    } as any

    const id = createHash('sha256').update(
        Buffer.from(JSON.stringify(serializeEvent(event))),
    ).digest().toString('hex')

    const sig = Buffer.from(
        secp256k1.schnorr.signSync(id, privkey),
    ).toString('hex')

    event.id = id
    event.sig = sig

    return event
}

export function createIdentity(name: string) {
    const hmac = createHmac('sha256', Math.random().toString())
    hmac.update(name)
    const privkey = hmac.digest().toString('hex')
    const pubkey = Buffer.from(secp256k1.getPublicKey(privkey, true)).toString(
        'hex',
    ).substring(2)
    const author = {
        name,
        privkey,
        pubkey,
    }
    return author
}

export async function createSubscription(
    ws: WebSocketWrapper,
    subscriptionName: string,
    subscriptionFilters: SubscriptionFilter[],
): Promise<void> {
    return new Promise<void>((resolve) => {
        const data = JSON.stringify([
            'REQ',
            subscriptionName,
            ...subscriptionFilters,
        ])
        ws.send(data)
        resolve()
    })
}

export async function waitForEOSE(
    ws: WebSocketWrapper,
    subscription: string,
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const observable = streams.get(ws) as Observable<OutgoingMessage>

        const sub = observable.subscribe((message: OutgoingMessage) => {
            if (message[0] === MessageType.EOSE && message[1] === subscription) {
                resolve()
                sub.unsubscribe()
            } else if (message[0] === MessageType.NOTICE) {
                reject(new Error(message[1]))
                sub.unsubscribe()
            }
        })
    })
}

export async function sendEvent(
    ws: WebSocketWrapper,
    event: Event,
    successful = true,
) {
    return new Promise<OutgoingMessage>((resolve, reject) => {
        const observable = streams.get(ws) as Observable<OutgoingMessage>
        const sub = observable.subscribe((message: OutgoingMessage) => {
            if (message[0] === MessageType.OK && message[1] === event.id) {
                if (message[2] === successful) {
                    sub.unsubscribe()
                    resolve(message)
                } else {
                    sub.unsubscribe()
                    reject(new Error(message[3]))
                }
            } else if (message[0] === MessageType.NOTICE) {
                sub.unsubscribe()
                reject(new Error(message[1]))
            }
        })

        ws.send(JSON.stringify(['EVENT', event]))
    })
}

export async function waitForNextEvent(
    ws: WebSocketWrapper,
    subscription: string,
    content?: string,
): Promise<Event> {
    return new Promise((resolve, reject) => {
        const observable = streams.get(ws) as Observable<OutgoingMessage>

        observable.subscribe(async (message: OutgoingMessage) => {
            await new Promise((a) => setTimeout(a, 100))
            if (message[0] === MessageType.EVENT && message[1] === subscription) {
                const event = message[2] as Event
                if (typeof content !== 'string' || event.content === content) {
                    resolve(message[2])
                }
            } else if (message[0] === MessageType.NOTICE) {
                reject(new Error(message[1]))
            }
        })
    })
}

export async function waitForEventCount(
    ws: WebSocketWrapper,
    subscription: string,
    count = 1,
    eose = false,
): Promise<Event[]> {
    const events: Event[] = []

    return new Promise((resolve, reject) => {
        const observable = streams.get(ws) as Observable<OutgoingMessage>

        observable.subscribe((message: OutgoingMessage) => {
            if (message[0] === MessageType.EVENT && message[1] === subscription) {
                events.push(message[2])
                if (!eose && events.length === count) {
                    resolve(events)
                } else if (events.length > count) {
                    reject(
                        new Error(`Expected ${count} but got ${events.length} events`),
                    )
                }
            } else if (
                message[0] === MessageType.EOSE && message[1] === subscription
            ) {
                if (!eose) {
                    reject(new Error('Expected event but received EOSE'))
                } else if (events.length !== count) {
                    reject(
                        new Error(
                            `Expected ${count} but got ${events.length} events before EOSE`,
                        ),
                    )
                } else {
                    resolve(events)
                }
            } else if (message[0] === MessageType.NOTICE) {
                reject(new Error(message[1]))
            }
        })
    })
}

export async function waitForNotice(ws: WebSocketWrapper): Promise<string> {
    return new Promise<string>((resolve) => {
        const observable = streams.get(ws) as Observable<OutgoingMessage>

        observable.subscribe((message: OutgoingMessage) => {
            if (message[0] === MessageType.NOTICE) {
                resolve(message[1])
            }
        })
    })
}

export async function waitForCommand(ws: WebSocketWrapper): Promise<CommandResult> {
    return new Promise<CommandResult>((resolve) => {
        const observable = streams.get(ws) as Observable<OutgoingMessage>

        observable.subscribe((message: OutgoingMessage) => {
            if (message[0] === MessageType.OK) {
                resolve(message)
            }
        })
    })
}
