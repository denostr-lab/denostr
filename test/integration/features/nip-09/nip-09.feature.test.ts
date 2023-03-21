import { expect } from 'chai'

import { Tag } from '../../../../src/@types/base.ts'
import { Event } from '../../../../src/@types/event.ts'
import { EventTags } from '../../../../src/constants/base.ts'
import { createEvent, sendEvent, waitForEventCount, WebSocketWrapper } from '../helpers.ts'
import { isDraft, Given, Then, When, startTest } from '../shared.ts'
import type { IWorld } from '../types.ts'
startTest(import.meta.url, ()=> {
    When(
        /^(\w+) sends a text_note event with content "([^"]+)"$/,
        async function (this: IWorld, name: string, content: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const { pubkey, privkey } = this.parameters.identities[name]
            const event: Event = await createEvent(
                { pubkey, kind: 1, content },
                privkey,
            )
    
            await sendEvent(ws, event)
            this.parameters.events[name].push(event)
        },
    )

    When(/^(\w+) sends a delete event for their last event$/, async function (
        this: IWorld,
        name: string,
    ) {
        const ws = this.parameters.clients[name] as WebSocketWrapper
        const { pubkey, privkey } = this.parameters.identities[name]
        const tags: Tag[] = [
            [
                EventTags.Event,
                this.parameters.events[name][this.parameters.events[name].length - 1].id,
            ],
        ]
    
        const event: Event = await createEvent(
            { pubkey, kind: 5, content: '', tags },
            privkey,
        )
    
        await sendEvent(ws, event)
    
        this.parameters.events[name].push(event)
    })
    
    Then(
        /(\w+) receives (\d+) delete events? from (\w+) and EOSE$/,
        async function (this: IWorld, name: string, count: string, author: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const [event] = await waitForEventCount(
                ws,
                subscription.name,
                Number(count),
                true,
            )
    
            expect(event.kind).to.equal(5)
            expect(event.pubkey).to.equal(this.parameters.identities[author].pubkey)
        },
    )
    
    Then(
        /(\w+) receives (\d+) delete events? from (\w+)$/,
        async function (this: IWorld, name: string, count: string, author: string) {
            const ws = this.parameters.clients[name] as WebSocketWrapper
            const subscription = this.parameters
                .subscriptions[name][this.parameters.subscriptions[name].length - 1]
            const [event] = await waitForEventCount(
                ws,
                subscription.name,
                Number(count),
                false,
            )
    
            expect(event.kind).to.equal(5)
            expect(event.pubkey).to.equal(this.parameters.identities[author].pubkey)
        },
    )
    
    When(
        /^(\w+) drafts a text_note event with content "([^"]+)"$/,
        async function (this: IWorld, name: string, content: string) {
            const { pubkey, privkey } = this.parameters.identities[name]
    
            const event: Event = await createEvent(
                { pubkey, kind: 1, content },
                privkey,
            )
    
            event[isDraft] = true
    
            this.parameters.events[name].push(event)
        },
    )
    
    Given(/^(\w+) drafts a set_metadata event$/, async function (this: IWorld, name: string) {
        const { pubkey, privkey } = this.parameters.identities[name]
    
        const content = JSON.stringify({ name })
        const event: Event = await createEvent({ pubkey, kind: 0, content }, privkey)
    
        event[isDraft] = true
    
        this.parameters.events[name].push(event)
    })
})
