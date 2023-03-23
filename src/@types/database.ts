import { DatabaseTransaction } from './base.ts'

export interface ITransaction {
    begin(): Promise<void>
    get transaction(): DatabaseTransaction
    commit(): Promise<any[]>
    rollback(): Promise<any[]>
}
