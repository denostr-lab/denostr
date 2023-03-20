import mongoose from 'npm:mongoose'

import { Pubkey } from '../@types/base.ts'
import { IUserRepository } from '../@types/repositories.ts'
import { User } from '../@types/user.ts'
import { UsersModel } from '../database/models/index.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { fromDBUser, toBuffer } from '../utils/transform.ts'

const debug = createLogger('user-repository')

export class UserRepository implements IUserRepository {
    public constructor(private readonly dbClient: mongoose.Connection) {}

    public async findByPubkey(
        pubkey: Pubkey,
        client: mongoose.Connection = this.dbClient,
    ): Promise<User | undefined> {
        debug('find by pubkey: %s', pubkey)
        const dbuser = await client.model(UsersModel.name, UsersModel.schema)
            .findOne({
                pubkey: toBuffer(pubkey),
            })

        if (!dbuser) {
            return
        }

        return fromDBUser(dbuser)
    }

    public async upsert(
        user: User,
        client: mongoose.Connection = this.dbClient,
    ): Promise<number> {
        debug('upsert: %o', user)

        const date = new Date()

        const row = {
            pubkey: Buffer.from(user.pubkey, 'hex'),
            is_admitted: user.isAdmitted,
            tos_accepted_at: user.tosAcceptedAt,
            updated_at: date,
            created_at: date,
        }

        const filter = { pubkey: row.pubkey }
        const options = { upsert: true }

        const model = client.model(UsersModel.name, UsersModel.schema)
        const result = await model.updateOne(filter, { $set: row }, options)

        return result.upsertedCount ?? result.modifiedCount
    }

    public async getBalanceByPubkey(
        pubkey: Pubkey,
        client: mongoose.Connection = this.dbClient,
    ): Promise<bigint> {
        debug('get balance for pubkey: %s', pubkey)

        const user = await client.model(UsersModel.name, UsersModel.schema)
            .findOne({ pubkey: toBuffer(pubkey) }, { balance: 1 })

        if (!user) {
            return 0n
        }

        return BigInt(user.balance)
    }
}
