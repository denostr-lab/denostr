import { always, applySpec, ifElse, is, pipe, prop, propSatisfies, toString } from 'ramda'

import { DBInvoice, Invoice, InvoiceStatus } from '@/@types/invoice.ts'
import { IInvoiceRepository } from '@/@types/repositories.ts'
import { createLogger } from '@/factories/logger-factory.ts'
import { fromDBInvoice } from '@/utils/transform.ts'
import { masterInvoicesModel } from '@/database/models/Invoices.ts'
import { masterUsersModel } from '@/database/models/Users.ts'
import { DatabaseTransaction } from '@/@types/base.ts'

const debug = createLogger('invoice-repository')

export class InvoiceRepository implements IInvoiceRepository {
    public async confirmInvoice(
        invoiceId: string,
        amountPaid: bigint,
        confirmedAt: Date,
        session: DatabaseTransaction,
    ): Promise<void> {
        debug(
            'confirming invoice %s at %s: %s',
            invoiceId,
            confirmedAt,
            amountPaid,
        )

        try {
            const invoice = await masterInvoicesModel.findOne({ _id: invoiceId })
            if (invoice) {
                const options = { ...(session && { session }) }

                await masterInvoicesModel.updateOne(
                    { _id: invoiceId },
                    {
                        $set: {
                            confirmed_at: confirmedAt,
                            amount_paid: amountPaid,
                            updated_at: new Date(),
                        },
                    },
                    options,
                )

                let balance = 0n
                if (invoice.unit === 'sats') {
                    balance = amountPaid * 1000n
                } else if (invoice.unit === 'msats') {
                    balance = amountPaid
                } else if (invoice.unit === 'btc') {
                    balance = amountPaid * 100000000n * 1000n
                }

                await masterUsersModel.updateOne(
                    { pubkey: invoice.pubkey },
                    {
                        $inc: { balance },
                    },
                    options,
                )
            }
        } catch (error) {
            console.error('Unable to confirm invoice. Reason:', error.message)

            throw error
        }
    }

    public async findById(
        invoiceId: string,
    ): Promise<Invoice | undefined> {
        const dbInvoice = await masterInvoicesModel.findOne({ _id: invoiceId })

        if (!dbInvoice) {
            return
        }

        return fromDBInvoice(dbInvoice)
    }

    public async findPendingInvoices(
        offset = 0,
        limit = 10,
    ): Promise<Invoice[]> {
        const dbInvoices = await masterInvoicesModel.paginate({ status: InvoiceStatus.PENDING }, { offset, limit })

        return dbInvoices.docs.map(fromDBInvoice)
    }

    public updateStatus(
        invoice: Invoice,
        session?: DatabaseTransaction,
    ): Promise<Invoice | undefined> {
        debug('updating invoice status: %o', invoice)

        const options: any = { ...(session && { session }) }
        const query = masterInvoicesModel.updateOne({
            _id: invoice.id,
        }, {
            status: invoice.status,
            updated_at: new Date(),
        }, options)

        return ignoreUpdateConflicts(query)
    }

    public upsert(
        invoice: Invoice,
    ): Promise<number> {
        debug('upserting invoice: %o', invoice)

        const row: DBInvoice = applySpec({
            _id: ifElse(
                propSatisfies(is(String), 'id'),
                prop('id'),
                always(crypto.randomUUID()),
            ),
            pubkey: prop('pubkey'),
            bolt11: prop('bolt11'),
            amount_requested: pipe(prop('amountRequested'), toString),
            // amount_paid: ifElse(propSatisfies(is(BigInt), 'amountPaid'), pipe(prop('amountPaid'), toString), always(null)),
            unit: prop('unit'),
            status: prop('status'),
            description: prop('description'),
            // confirmed_at: prop('confirmedAt'),
            expires_at: prop('expiresAt'),
            updated_at: always(new Date()),
            created_at: prop('createdAt'),
            verify_url: prop('verifyURL'),
        })(invoice)

        debug('row: %o', row)

        const query = masterInvoicesModel.updateOne({ _id: row._id }, { $set: row }, { upsert: true })

        return ignoreUpdateConflicts(query)
    }
}

async function ignoreUpdateConflicts(query: any) {
    try {
        const result = await query
        debug('ignoreUpdateConflicts result: %o', result)
        return result.upsertedCount || result.modifiedCount || 0
    } catch (err) {
        debug('ignoreUpdateConflicts error: %o', err)
        if (!String(err).indexOf('E11000 duplicate key error collection')) {
            console.error(String(err))
        }
        return 0
    }
}
