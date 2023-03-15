import Schema from 'joi'

import { MessageType } from '../@types/messages.ts'
import { subscriptionSchema } from './base-schema.ts'
import { eventSchema } from './event-schema.ts'
import { filterSchema } from './filter-schema.ts'

export const eventMessageSchema = Schema.array().ordered(
  Schema.string().valid('EVENT').required(),
  eventSchema.required(),
)
  .label('EVENT message')

export const reqMessageSchema = Schema.array()
  .ordered(Schema.string().valid('REQ').required(), Schema.string().max(256).required().label('subscriptionId'))
  .items(filterSchema.required().label('filter')).max(12)
  .label('REQ message')

export const closeMessageSchema = Schema.array().ordered(
  Schema.string().valid('CLOSE').required(),
  subscriptionSchema.required().label('subscriptionId'),
).label('CLOSE message')

export const messageSchema = Schema.alternatives()
  .conditional(Schema.ref('.'), {
    switch: [
      {
        is: Schema.array().ordered(Schema.string().equal(MessageType.EVENT)).items(Schema.any()),
        then: eventMessageSchema,
      },
      {
        is: Schema.array().ordered(Schema.string().equal(MessageType.REQ)).items(Schema.any()),
        then: reqMessageSchema,
      },
      {
        is: Schema.array().ordered(Schema.string().equal(MessageType.CLOSE)).items(Schema.any()),
        then: closeMessageSchema,
      },
    ],
  })
