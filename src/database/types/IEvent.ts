import type { Tag } from '../../@types/base.ts'
import type { IRecord } from './IRecord.ts'
import { Buffer } from 'Buffer'

export interface IEvent extends IRecord {
    event_id: Buffer
    event_pubkey: Buffer
    event_kind: number
    event_created_at: number
    event_content: string
    event_tags: Tag[][]
    event_signature: Buffer
    event_delegator?: Buffer | null
    event_deduplication?: (string | number)[] | null
    first_seen: Date
    deleted_at?: Date
    expires_at?: number
}
