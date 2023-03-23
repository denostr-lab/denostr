import mongoose from 'npm:mongoose'

import { Tag } from '../../@types/base.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../client.ts'

export interface EventInput {
    event_id: Buffer
    event_pubkey: Buffer
    event_kind: number
    event_created_at: number
    event_content: string
    event_tags: Tag[][]
    event_signature: Buffer
    event_delegator?: Buffer | null
    event_deduplication?: string[] | null
    first_seen: Date
}

export interface EventDocument extends EventInput, mongoose.Document {
    created_at: Date
    updated_at: Date
    expires_at?: number
}

const EventSchema = new mongoose.Schema({
    event_id: {
        type: mongoose.Schema.Types.Buffer,
        require: true,
    },
    event_pubkey: {
        type: mongoose.Schema.Types.Buffer,
    },
    event_kind: {
        type: Number,
    },
    event_created_at: {
        type: Number,
        default: Date.now(),
    },
    event_content: {
        type: String,
    },
    event_tags: {
        type: [[String]],
    },
    event_signature: {
        type: mongoose.Schema.Types.Buffer,
    },
    event_delegator: {
        type: mongoose.Schema.Types.Buffer,
    },
    event_deduplication: [String],
    first_seen: { type: Date },
    deleted_at: { type: Date },
})

EventSchema.index({ 'event_id': 1 }, {
    background: true,
    unique: true,
})
EventSchema.index({ 'event_pubkey': 1 }, {
    background: true,
})
EventSchema.index({ 'event_kind': 1 }, {
    background: true,
})
EventSchema.index({ 'event_signature': 1 }, {
    background: true,
})

export const EventsModel = (dbClient: mongoose.Connection) =>
    dbClient.model<EventDocument>(
        'Events',
        EventSchema,
        'events',
    )

export const masterEventsModel = EventsModel(getMasterDbClient())
export const readReplicaEventsModel = EventsModel(getReadReplicaDbClient())
