import { EventKinds } from '../constants/base.ts'
import { EventId, Pubkey } from './base.ts'

export type SubscriptionId = string

export interface SubscriptionFilter {
    ids?: EventId[]
    kinds?: EventKinds[]
    since?: number
    until?: number
    authors?: Pubkey[]
    limit?: number
    [key: `#${string}`]: string[]
}
