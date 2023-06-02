import mongoose from 'mongoose'

import { getMasterDbClient, getReadReplicaDbClient } from '@/database/client.ts'
import { DBUser } from '@/@types/user.ts'

const UserSchema = new mongoose.Schema({
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

UserSchema.index({ 'pubkey': 1 }, {
    background: true,
    unique: true,
})
UserSchema.index({ 'balance': 1 }, {
    background: true,
})
UserSchema.index({ 'is_admitted': 1 }, {
    background: true,
})
UserSchema.index({ 'created_at': 1 }, {
    background: true,
})

export const UsersModelName = 'Users'
export const UsersCollectionName = 'users'

export const UsersModel = (dbClient: mongoose.Connection) =>
    dbClient.model<DBUser>(
        UsersModelName,
        UserSchema,
        UsersCollectionName,
    )

export const masterUsersModel = UsersModel(getMasterDbClient())
export const readReplicaUsersModel = UsersModel(getReadReplicaDbClient())
