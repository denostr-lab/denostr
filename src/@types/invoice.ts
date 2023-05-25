import { Buffer } from 'Buffer'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

import { Pubkey } from './base.ts'

export enum InvoiceUnit {
    MSATS = 'msats',
    SATS = 'sats',
    BTC = 'btc',
}

export enum InvoiceStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
}

export interface Invoice {
    id: string
    pubkey: Pubkey
    bolt11: string
    amountRequested: bigint
    amountPaid?: bigint
    unit: InvoiceUnit
    status: InvoiceStatus
    description: string
    confirmedAt?: Date | null
    expiresAt: Date | null
    updatedAt: Date
    createdAt: Date
    verifyURL?: string
}

export interface LnurlInvoice extends Invoice {
    verifyURL: string
}

export interface DBInvoice extends mongoose.Document {
    _id: ObjectId
    id: string
    pubkey: Buffer
    bolt11: string
    amount_requested: bigint
    amount_paid: bigint
    unit: InvoiceUnit
    status: InvoiceStatus
    description: string
    confirmed_at: Date
    expires_at: Date
    updated_at: Date
    created_at: Date
    verify_url: string
}
