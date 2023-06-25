import mongoose from 'mongoose'
import paginate from 'mongoose-paginate'
import aggregatePaginate from 'mongoose-aggregate-paginate'

import { getMasterDbClient, getReadReplicaDbClient } from '@/database/client.ts'
import { DBInvoice } from '@/@types/invoice.ts'

const invoiceSchema = new mongoose.Schema({
    _id: String,
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
})

invoiceSchema.plugin(paginate)
invoiceSchema.plugin(aggregatePaginate)

invoiceSchema.index({ 'pubkey': 1 }, {
    background: true,
})

invoiceSchema.index({ 'bolt11': 1 }, {
    background: true,
})

invoiceSchema.index({ 'amount_requested': 1 }, {
    background: true,
})

invoiceSchema.index({ 'amount_paid': 1 }, {
    background: true,
    sparse: true,
})

invoiceSchema.index({ 'unit': 1 }, {
    background: true,
})

invoiceSchema.index({ 'status': 1 }, {
    background: true,
})

invoiceSchema.index({ 'created_at': 1 }, {
    background: true,
})

invoiceSchema.index({ 'confirmed_at': 1 }, {
    background: true,
    sparse: true,
})

export const modelName = 'Invoices'
export const collectionName = 'invoices'

export const InvoicesModel = (dbClient: mongoose.Connection) =>
    dbClient.model<DBInvoice, mongoose.PaginateModel<DBInvoice>>(
        modelName,
        invoiceSchema,
        collectionName,
    )

export const masterInvoicesModel = InvoicesModel(getMasterDbClient())
export const readReplicaInvoicesModel = InvoicesModel(getReadReplicaDbClient())
