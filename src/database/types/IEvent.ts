import type { Tag } from '../../@types/base.ts'
import type { IRecord } from './IRecord.ts'

export interface IEvent extends IRecord {
    _id: string
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
    deleted_at?: Date
    expires_at?: number
}
