import { always, applySpec, prop } from 'ramda'

import { DatabaseTransaction, Pubkey } from '@/@types/base.ts'
import { IUserRepository } from '../@types/repositories.ts'
import { User } from '../@types/user.ts'
import { Settings } from '../@types/settings.ts'
import { masterUsersModel } from '../database/models/Users.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { fromDBUser } from '../utils/transform.ts'

const debug = createLogger('user-repository')

export class UserRepository implements IUserRepository {
    constructor(private readonly settings: () => Settings) {}

    public async findByPubkey(pubkey: Pubkey): Promise<User | undefined> {
        debug('find by pubkey: %s', pubkey)
        const dbuser = await masterUsersModel.findOne({ pubkey })
        if (!dbuser) {
            return
        }

        return fromDBUser(dbuser)
    }

    public async upsert(user: User, session?: DatabaseTransaction): Promise<number> {
        debug('upsert: %o', user)

        const date = new Date()

        const row = applySpec({
            pubkey: prop('pubkey'),
            is_admitted: prop('isAdmitted'),
            tos_accepted_at: prop('tosAcceptedAt'),
            updated_at: always(date),
            created_at: always(date),
        })(user)

        const filter = { pubkey: row.pubkey }
        const options: any = { upsert: true, ...(session && { session }) }
        const result = await masterUsersModel.updateOne(filter, { $set: row }, options)

        return result.upsertedCount ?? result.modifiedCount
    }

    public async getBalanceByPubkey(pubkey: Pubkey): Promise<bigint> {
        debug('get balance for pubkey: %s', pubkey)

        const user = await masterUsersModel.findOne({ pubkey }, { balance: 1 })

        if (!user) {
            return 0n
        }

        return user.balance
    }
}
