import { PassThrough, Stream } from 'stream'

import mongoose from 'mongoose'

import { DatabaseTransaction, EventId, Pubkey } from './base.ts'
import { DBEvent, Event } from './event.ts'
import { Invoice } from './invoice.ts'
import { SubscriptionFilter } from './subscription.ts'
import { User } from './user.ts'

export type ExposedPromiseKeys = 'then' | 'catch' | 'finally'

export interface IQueryResult<T> extends Pick<Promise<T>, keyof Promise<T> & ExposedPromiseKeys> {
    stream(options?: Record<string, any>): PassThrough & AsyncIterable<T>
}

export interface IEventRepository {
    create(event: Event): Promise<number>
    upsert(event: Event): Promise<number>
    findByFilters(filters: SubscriptionFilter[]): { cursor: Promise<DBEvent[]> | Stream}
    insertStubs(pubkey: string, eventIdsToDelete: EventId[]): Promise<number>
    deleteByPubkeyAndIds(pubkey: Pubkey, ids: EventId[]): Promise<number>
}

export interface IInvoiceRepository {
    findById(invoiceId: string): Promise<Invoice | undefined>
    upsert(invoice: Partial<Invoice>): Promise<number>
    updateStatus(
        invoice: Pick<Invoice, 'id' | 'status'>,
        session?: DatabaseTransaction,
    ): Promise<Invoice | undefined>
    confirmInvoice(
        invoiceId: string,
        amountReceived: bigint,
        confirmedAt: Date,
        session?: DatabaseTransaction,
    ): Promise<void>
    findPendingInvoices(
        offset?: number,
        limit?: number,
    ): Promise<Invoice[]>
}

export interface IUserRepository {
    findByPubkey(
        pubkey: Pubkey,
        client?: mongoose.Connection,
    ): Promise<User | undefined>
    upsert(user: Partial<User>, session?: DatabaseTransaction): Promise<number>
    getBalanceByPubkey(pubkey: Pubkey, client?: mongoose.Connection): Promise<bigint>
}
