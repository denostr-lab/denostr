import { expect } from 'chai'
import { Then, When, startTest } from '../shared.ts'

import { Event } from '../../../../src/@types/event.ts'
import { createEvent, createSubscription, sendEvent, waitForNextEvent, WebSocketWrapper } from '../helpers.ts'
import type { IWorld } from '../types.ts'

startTest(import.meta.url, ()=> {
    When(
        /^(\w+) sends a channel_creation event with content '([^']+)'$/,
        async function (this: IWorld, name: string, content: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const { pubkey, privkey } = this.parameters.identities[name]
    
            const event: Event = await createEvent(
                { pubkey, kind: 40, content },
                privkey,
            )
            this.parameters.channels.push(event.id)
            await sendEvent(ws, event)
            this.parameters.events[name].push(event)
        },
    )
    
    When(
        /(\w+) subscribes to last event from (\w+)$/,
        async function (this: IWorld, from: string, to: string) {
            const ws = this.parameters.clients[from] as WebSocketWrapper
            const event = this.parameters.events[to].pop()
            const subscription = {
                name: `test-${Math.random()}`,
                filters: [{ ids: [event.id] }],
            }
            this.parameters.subscriptions[from].push(subscription)
    
            await createSubscription(ws, subscription.name, subscription.filters)
    
        },
    )

    When(
        /^(\w+) sends a channel_metadata event with content '([^']+)'$/,
        async function (this: IWorld, name: string, content: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const { pubkey, privkey } = this.parameters.identities[name]
    
            const channel = this.parameters.channels[this.parameters.channels.length - 1]
            const event: Event = await createEvent({
                pubkey,
                kind: 41,
                content,
                tags: [['e', channel]],
            }, privkey)
    
            await sendEvent(ws, event)
            this.parameters.events[name].push(event)
        },
    )
    
    Then(
        /(\w+) receives a channel_creation event from (\w+) with content '([^']+?)'/,
        async function (this: IWorld, name: string, author: string, content: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const receivedEvent = await waitForNextEvent(
                ws,
                subscription.name,
                content,
            )
    
            expect(receivedEvent.kind).to.equal(40)
            expect(receivedEvent.pubkey).to.equal(
                this.parameters.identities[author].pubkey,
            )
            expect(receivedEvent.content).to.equal(content)
        },
    )
    
    Then(
        /(\w+) receives a channel_metadata event from (\w+) with content '([^']+?)'/,
        async function (this: IWorld, name: string, author: string, content: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const receivedEvent = await waitForNextEvent(
                ws,
                subscription.name,
                content,
            )
    
            const channel = this.parameters.channels[this.parameters.channels.length - 1]
    
            expect(receivedEvent.kind).to.equal(41)
            expect(receivedEvent.pubkey).to.equal(
                this.parameters.identities[author].pubkey,
            )
            expect(receivedEvent.content).to.equal(content)
            expect(receivedEvent.tags).to.deep.include(['e', channel])
        },
    )
    
    When(
        /^(\w+) subscribes to channel_creation events$/,
        async function (this: IWorld, name: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = {
                name: `test-${Math.random()}`,
                filters: [{ kinds: [40] }],
            }
            this.parameters.subscriptions[name].push(subscription)
    
            await createSubscription(ws, subscription.name, subscription.filters)
        },
    )
    
    When(
        /^(\w+) subscribes to channel_metadata events$/,
        async function (this: IWorld, name: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = {
                name: `test-${Math.random()}`,
                filters: [{ kinds: [41] }],
            }
            this.parameters.subscriptions[name].push(subscription)
    
            await createSubscription(ws, subscription.name, subscription.filters)
        },
    )
})
