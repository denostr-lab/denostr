import mongoose from 'mongoose'

import { getMasterDbClient, getReadReplicaDbClient } from '../client.ts'
import { Buffer } from 'Buffer'

export interface UserInput {
    pubkey: Buffer
    is_admitted: boolean
    balance: bigint
}

export interface UserDocument extends UserInput, mongoose.Document {
    created_at: Date
    updated_at: Date
}

const UserSchema = new mongoose.Schema({
    pubkey: {
        type: mongoose.Schema.Types.Buffer,
        require: true,
    },
    is_admitted: {
        type: mongoose.Schema.Types.Buffer,
    },
    balance: { type: Number },
})

UserSchema.index({ 'pubkey': 1 }, {
    background: true,
    unique: true,
})
UserSchema.index({ 'balance': 1 }, {
    background: true,
})

export const UsersModelName = 'Users'
export const UsersCollectionName = 'users'

export const UsersModel = (dbClient: mongoose.Connection) =>
    dbClient.model<UserDocument>(
        UsersModelName,
        UserSchema,
        UsersCollectionName,
    )

export const masterUsersModel = UsersModel(getMasterDbClient())
export const readReplicaUsersModel = UsersModel(getReadReplicaDbClient())
