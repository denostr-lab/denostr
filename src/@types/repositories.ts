import { PassThrough } from 'stream'

import mongoose from 'mongoose'

import { DatabaseClient, EventId, Pubkey } from './base.ts'
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
    findByFilters(filters: SubscriptionFilter[]): mongoose.Aggregate<DBEvent[]>
    insertStubs(pubkey: string, eventIdsToDelete: EventId[]): Promise<number>
    deleteByPubkeyAndIds(pubkey: Pubkey, ids: EventId[]): Promise<number>
}

export interface IInvoiceRepository {
    findById(id: string, client?: DatabaseClient): Promise<Invoice | undefined>
    upsert(invoice: Partial<Invoice>, client?: DatabaseClient): Promise<number>
    confirmInvoice(
        invoiceId: string,
        amountReceived: bigint,
        confirmedAt: Date,
        client?: DatabaseClient,
    ): Promise<void>
    findPendingInvoices(
        offset?: number,
        limit?: number,
        client?: DatabaseClient,
    ): Promise<Invoice[]>
}

export interface IUserRepository {
    findByPubkey(
        pubkey: Pubkey,
        client?: mongoose.Connection,
    ): Promise<User | undefined>
    upsert(user: Partial<User>, client?: mongoose.Connection): Promise<number>
    getBalanceByPubkey(pubkey: Pubkey, client?: mongoose.Connection): Promise<bigint>
}
