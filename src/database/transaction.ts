import { ClientSessionOptions } from 'mongodb'

import { DatabaseClient, DatabaseTransaction } from '@/@types/base.ts'
import { ITransaction } from '@/@types/database.ts'

export class Transaction implements ITransaction {
    private session!: DatabaseTransaction

    public constructor(
        private readonly dbClient: DatabaseClient,
    ) {}

    public async begin(options?: ClientSessionOptions): Promise<void> {
        try {
            this.session = await this.dbClient.startSession({
                causalConsistency: true,
                defaultTransactionOptions: {
                    writeConcern: { w: 'majority' },
                    readConcern: { level: 'local' },
                    readPreference: 'primary',
                },
                ...options,
            })
            this.session.startTransaction()
        } catch (err) {
            await this.rollback()
            throw err
        }
    }

    public get transaction(): DatabaseTransaction {
        if (!this.session) {
            throw new Error('Unable to get transaction: transaction not started.')
        }
        return this.session
    }

    public async commit(): Promise<void> {
        if (!this.session) {
            throw new Error('Unable to get transaction: transaction not started.')
        }

        try {
            await this.session.commitTransaction()
            await this.session.endSession()
        } catch (err) {
            await this.rollback()
            throw err
        }
    }

    public async rollback(): Promise<void> {
        if (!this.session) {
            throw new Error('Unable to get transaction: transaction not started.')
        }

        try {
            await this.session.abortTransaction()
            await this.session.endSession()
        } catch (err) {
            console.error('Error rolling back transaction:', err.message)
            throw err
        }
    }
}
