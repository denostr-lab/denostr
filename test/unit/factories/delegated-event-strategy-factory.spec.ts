import { expect } from 'chai'

import { DefaultEventStrategy } from '../../../src/handlers/event-strategies/default-event-strategy.ts'
import { delegatedEventStrategyFactory } from '../../../src/factories/delegated-event-strategy-factory.ts'
import { EphemeralEventStrategy } from '../../../src/handlers/event-strategies/ephemeral-event-strategy.ts'
import { Event } from '../../../src/@types/event.ts'
import { EventKinds } from '../../../src/constants/base.ts'
import { Factory } from '../../../src/@types/base.ts'
import { IEventRepository } from '../../../src/@types/repositories.ts'
import { IEventStrategy } from '../../../src/@types/message-handlers.ts'
import { IWebSocketAdapter } from '../../../src/@types/adapters.ts'

describe('delegatedEventStrategyFactory', () => {
  let eventRepository: IEventRepository
  let event: Event
  let adapter: IWebSocketAdapter
  let factory: Factory<IEventStrategy<Event, Promise<void>>, [Event, IWebSocketAdapter]>

  beforeEach(() => {
    eventRepository = {} as any
    event = {} as any
    adapter = {} as any

    factory = delegatedEventStrategyFactory(eventRepository)
  })

  it('returns EphemeralEventStrategy given a set_metadata event', () => {
    event.kind = EventKinds.EPHEMERAL_FIRST
    expect(factory([event, adapter])).to.be.an.instanceOf(EphemeralEventStrategy)
  })

  it('returns DefaultEventStrategy given a text_note event', () => {
    event.kind = EventKinds.TEXT_NOTE
    expect(factory([event, adapter])).to.be.an.instanceOf(DefaultEventStrategy)
  })

  it('returns undefined given a replaceable event', () => {
    event.kind = EventKinds.REPLACEABLE_FIRST
    expect(factory([event, adapter])).to.be.undefined
  })

  it('returns undefined given a delete event', () => {
    event.kind = EventKinds.DELETE
    expect(factory([event, adapter])).to.be.undefined
  })
})
