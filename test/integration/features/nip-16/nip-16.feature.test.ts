import { Then, When, startTest} from '../shared.ts'
import { expect } from 'chai'

import { Event } from '../../../../src/@types/event.ts'
import { createEvent, sendEvent, waitForEventCount, waitForNextEvent, WebSocketWrapper } from '../helpers.ts'
import type { IWorld } from '../types.ts'

startTest(import.meta.url, ()=> {
    When(
        /^(\w+) sends a replaceable_event_0 event with content "([^"]+)"$/,
        async function (
            this: IWorld,
            name: string,
            content: string,
        ) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const { pubkey, privkey } = this.parameters.identities[name]
    
            const event: Event = await createEvent(
                { pubkey, kind: 10000, content },
                privkey,
            )
    
            await sendEvent(ws, event)
            this.parameters.events[name].push(event)
        },
    )
    
    Then(
        /(\w+) receives a replaceable_event_0 event from (\w+) with content "([^"]+?)"/,
        async function (this: IWorld, name: string, author: string, content: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const receivedEvent = await waitForNextEvent(ws, subscription.name)
    
            expect(receivedEvent.kind).to.equal(10000)
            expect(receivedEvent.pubkey).to.equal(
                this.parameters.identities[author].pubkey,
            )
            expect(receivedEvent.content).to.equal(content)
        },
    )
    
    Then(
        /(\w+) receives (\d+) replaceable_event_0 events? from (\w+) with content "([^"]+?)" and EOSE/,
        async function (
            this: IWorld,
            name: string,
            count: string,
            author: string,
            content: string,
        ) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const events = await waitForEventCount(
                ws,
                subscription.name,
                Number(count),
                true,
            )
    
            expect(events.length).to.equal(Number(count))
            expect(events[0].kind).to.equal(10000)
            expect(events[0].pubkey).to.equal(
                this.parameters.identities[author].pubkey,
            )
            expect(events[0].content).to.equal(content)
        },
    )
    
    When(
        /^(\w+) sends a ephemeral_event_0 event with content "([^"]+)"$/,
        async function (
            this: IWorld,
            name: string,
            content: string,
        ) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const { pubkey, privkey } = this.parameters.identities[name]
    
            const event: Event = await createEvent(
                { pubkey, kind: 20000, content },
                privkey,
            )
    
            await sendEvent(ws, event)
            this.parameters.events[name].push(event)
        },
    )
    
    Then(
        /(\w+) receives a ephemeral_event_0 event from (\w+) with content "([^"]+?)"/,
        async function (this: IWorld, name: string, author: string, content: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const receivedEvent = await waitForNextEvent(ws, subscription.name)
    
            expect(receivedEvent.kind).to.equal(20000)
            expect(receivedEvent.pubkey).to.equal(
                this.parameters.identities[author].pubkey,
            )
            expect(receivedEvent.content).to.equal(content)
        },
    )
    
    Then(/(\w+) receives (\d+) ephemeral_event_0 events? and EOSE/, async function (
        this: IWorld,
        name: string,
        count: string,
    ) {
        const ws = this.parameters.clients[name] as WebSocketWrapper
        const subscription = this.parameters
            .subscriptions[name][this.parameters.subscriptions[name].length - 1]
        const events = await waitForEventCount(
            ws,
            subscription.name,
            Number(count),
            true,
        )
    
        expect(events.length).to.equal(Number(count))
    })
})