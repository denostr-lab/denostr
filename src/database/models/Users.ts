import mongoose from 'mongoose'
import paginate from 'mongoose-paginate'
import aggregatePaginate from 'mongoose-aggregate-paginate'

import { getMasterDbClient, getReadReplicaDbClient } from '@/database/client.ts'
import { DBUser } from '@/@types/user.ts'

const userSchema = new mongoose.Schema({
    pubkey: {
        type: String,
    },
    is_admitted: {
        type: Boolean,
        default: false,
    },
    tos_accepted_at: {
        type: Date,
    },
    balance: {
        type: BigInt,
        default: 0n,
    },
    updated_at: {
        type: Date,
        default: new Date(),
    },
    created_at: {
        type: Date,
        default: new Date(),
    },
}, {
    _id: false,
})

userSchema.plugin(paginate)
userSchema.plugin(aggregatePaginate)

userSchema.index({ 'pubkey': 1 }, {
    background: true,
    unique: true,
})
userSchema.index({ 'balance': 1 }, {
    background: true,
})
userSchema.index({ 'is_admitted': 1 }, {
    background: true,
})
userSchema.index({ 'created_at': 1 }, {
    background: true,
})

export const modelName = 'Users'
export const collectionName = 'users'

export const UsersModel = (dbClient: mongoose.Connection) =>
    dbClient.model<DBUser, mongoose.PaginateModel<DBUser>>(
        modelName,
        userSchema,
        collectionName,
    )

export const masterUsersModel = UsersModel(getMasterDbClient())
export const readReplicaUsersModel = UsersModel(getReadReplicaDbClient())
