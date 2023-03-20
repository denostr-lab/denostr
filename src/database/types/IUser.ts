import type { IRecord } from './IRecord.ts'

export interface IUser extends IRecord {
    pubkey: Buffer
    is_admitted: boolean
    balance: bigint
}
