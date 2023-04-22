import mongoose from 'npm:mongoose'

import { Tag } from '../../@types/base.ts'
import { getMasterDbClient, getReadReplicaDbClient } from '../client.ts'
import { Buffer } from 'Buffer'

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
        type: Buffer,
        require: true,
    },
    event_pubkey: {
        type: Buffer,
        require: true,
    },
    event_kind: {
        type: Number,
        require: true,
    },
    event_created_at: {
        type: Number,
        require: true,
    },
    event_content: {
        type: String,
        require: true,
    },
    event_tags: {
        type: [[String]],
        require: true,
    },
    event_signature: {
        type: Buffer,
        require: true,
    },
    event_delegator: {
        type: Buffer,
    },
    event_deduplication: [mongoose.Schema.Types.Mixed],
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
EventSchema.index({ 'event_tags.0.0': 1 }, {
    background: true,
})
EventSchema.index({ 'event_tags.0.1': 1 }, {
    background: true,
})
EventSchema.index({ 'remote_address': 1 }, {
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
