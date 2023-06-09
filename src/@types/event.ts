import { Buffer } from 'Buffer'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

import { ContextMetadataKey, EventDeduplicationMetadataKey, EventDelegatorMetadataKey, EventExpirationTimeMetadataKey, EventKinds } from '../constants/base.ts'
import { ContextMetadata, EventId, Pubkey, Tag } from './base.ts'

export interface BaseEvent {
    id: EventId
    pubkey: Pubkey
    created_at: number
    kind: EventKinds
    tags: Tag[]
    sig: string
    content: string
}

export interface Event extends BaseEvent {
    [ContextMetadataKey]?: ContextMetadata
}

export type RelayedEvent = Event

export type UnsignedEvent = Omit<Event, 'sig'>

export type UnidentifiedEvent = Omit<UnsignedEvent, 'id'>

export interface DelegatedEvent extends Event {
    [EventDelegatorMetadataKey]?: Pubkey
}

export interface ExpiringEvent extends Event {
    [EventExpirationTimeMetadataKey]?: number
}

export interface ParameterizedReplaceableEvent extends Event {
    [EventDeduplicationMetadataKey]: string[]
}

export interface DBEvent extends mongoose.Document {
    _id: ObjectId
    event_id: Buffer
    event_pubkey: Buffer
    event_kind: number
    event_created_at: number
    event_content: string
    event_tags: Tag[]
    event_signature: Buffer
    event_delegator?: Buffer | null
    event_deduplication?: { 0: string; 1: number }[] | null
    first_seen?: Date
    deleted_at: string
    expires_at: number
}

export interface CanonicalEvent {
    0: 0
    1: string
    2: number
    3: number
    4: Tag[]
    5: string
}
