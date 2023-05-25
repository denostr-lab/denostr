import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

import { Pubkey } from './base.ts'

export interface User {
    pubkey: Pubkey
    isAdmitted: boolean
    balance: bigint
    tosAcceptedAt?: Date | null
    createdAt: Date
    updatedAt: Date
}

export interface DBUser extends mongoose.Document {
    _id: ObjectId
    pubkey: string
    is_admitted: boolean
    balance: bigint
    created_at: Date
    updated_at: Date
}
