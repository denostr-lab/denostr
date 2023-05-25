import mongoose from 'mongoose'

import { getMasterDbClient, getReadReplicaDbClient } from '@/database/client.ts'
import { DBInvoice } from '@/@types/invoice.ts'

const InvoiceSchema = new mongoose.Schema({
    id: {
        type: String,
    },
    pubkey: {
        type: String,
    },
    bolt11: {
        type: String,
    },
    amount_requested: {
        type: BigInt,
    },
    amount_paid: {
        type: BigInt,
    },
    unit: {
        type: String,
        enum: ['msats', 'sats', 'btc'],
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'expired'],
        default: 'pending',
    },
    description: {
        type: String,
    },
    confirmed_at: {
        type: Date,
    },
    expires_at: {
        type: Date,
    },
    updated_at: {
        type: Date,
        default: new Date(),
    },
    created_at: {
        type: Date,
        default: new Date(),
    },
    verify_url: {
        type: String,
    },
}, {
    id: true,
    _id: false,
})

InvoiceSchema.index({ 'id': 1 }, {
    unique: true,
})

InvoiceSchema.index({ 'pubkey': 1 }, {
    background: true,
})

InvoiceSchema.index({ 'bolt11': 1 }, {
    background: true,
})

InvoiceSchema.index({ 'amount_requested': 1 }, {
    background: true,
})

InvoiceSchema.index({ 'amount_paid': 1 }, {
    background: true,
    sparse: true,
})

InvoiceSchema.index({ 'unit': 1 }, {
    background: true,
})

InvoiceSchema.index({ 'status': 1 }, {
    background: true,
})

InvoiceSchema.index({ 'created_at': 1 }, {
    background: true,
})

InvoiceSchema.index({ 'confirmed_at': 1 }, {
    background: true,
    sparse: true,
})

export const InvoicesModelName = 'Invoices'
export const InvoicesCollectionName = 'invoices'

export const InvoicesModel = (dbClient: mongoose.Connection) =>
    dbClient.model<DBInvoice>(
        'Invoices',
        InvoiceSchema,
        'invoices',
    )

export const masterInvoicesModel = InvoicesModel(getMasterDbClient())
export const readReplicaInvoicesModel = InvoicesModel(getReadReplicaDbClient())
