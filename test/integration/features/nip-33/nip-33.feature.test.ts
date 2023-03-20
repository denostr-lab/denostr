import { Then, When, startTest } from '../shared.ts'

import { expect } from 'chai'
import { Buffer } from 'Buffer'

import { Event } from '../../../../src/@types/event.ts'
import { createEvent, sendEvent, waitForEventCount, waitForNextEvent, WebSocketWrapper } from '../helpers.ts'
import type { IWorld } from '../types.ts'
import { masterEventsModel } from '../../../../src/database/models/Events.ts'


startTest(import.meta.url, ()=> {
    When(
        /^(\w+) sends a parameterized_replaceable_event_0 event with content "([^"]+)" and tag (\w) containing "([^"]+)"$/,
        async function (
            this: IWorld,
            name: string,
            content: string,
            tag: string,
            value: string,
        ) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const { pubkey, privkey } = this.parameters.identities[name]
            const event: Event = await createEvent({
                pubkey,
                kind: 30000,
                content,
                tags: [[tag, value]],
            }, privkey)
            await sendEvent(ws, event)
            this.parameters.events[name].push(event)
        },
    )
    
    Then(
        /(\w+) receives a parameterized_replaceable_event_0 event from (\w+) with content "([^"]+?)" and tag (\w+) containing "([^"]+?)"/,
        async function (
            this: IWorld,
            name: string,
            author: string,
            content: string,
            tagName: string,
            tagValue: string,
        ) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const a = await masterEventsModel.find({
                event_pubkey: {$in:Object
                    .values(
                        this.parameters.identities as Record<string, { pubkey: string }>,
                    )
                    .map(({ pubkey }) => Buffer.from(pubkey, 'hex')),
            }})
            const receivedEvent = await waitForNextEvent(ws, subscription.name)
            expect(receivedEvent.kind).to.equal(30000)
            expect(receivedEvent.pubkey).to.equal(
                this.parameters.identities[author].pubkey,
            )
            expect(receivedEvent.content).to.equal(content)
            expect(receivedEvent.tags[0]).to.deep.equal([tagName, tagValue])
        },
    )
    
    Then(
        /(\w+) receives (\d+) parameterized_replaceable_event_0 events? from (\w+) with content "([^"]+?)" and EOSE/,
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
            expect(events[0].kind).to.equal(30000)
            expect(events[0].pubkey).to.equal(
                this.parameters.identities[author].pubkey,
            )
            expect(events[0].content).to.equal(content)
        },
    )
})
