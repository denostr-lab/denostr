import { expect } from 'chai'
import { describe, it } from 'jest'

import { Event } from '../../../src/@types/event.ts'
import { MessageType } from '../../../src/@types/messages.ts'
import { createEndOfStoredEventsNoticeMessage, createNoticeMessage, createOutgoingEventMessage } from '../../../src/utils/messages.ts'

describe('createNotice', () => {
  it('returns a notice message', () => {
    expect(createNoticeMessage('some notice')).to.deep.equal([MessageType.NOTICE, 'some notice'])
  })
})

describe('createOutgoingEventMessage', () => {
  it('returns an event message', () => {
    const event: Event = {
      id: 'some id',
    } as any
    expect(createOutgoingEventMessage('subscriptionId', event)).to.deep.equal([MessageType.EVENT, 'subscriptionId', event])
  })
})

describe('createEndOfStoredEventsNoticeMessage', () => {
  it('returns a EOSE message', () => {
    expect(createEndOfStoredEventsNoticeMessage('subscriptionId')).to.deep.equal([MessageType.EOSE, 'subscriptionId'])
  })
})

