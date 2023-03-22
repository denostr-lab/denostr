import type { IRecord } from './IRecord.ts'
import { Buffer } from 'Buffer'

export interface IUser extends IRecord {
    pubkey: Buffer
    is_admitted: boolean
    balance: bigint
}
