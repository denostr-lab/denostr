import { helpers, IController, Request, Response, RouterContext, Status } from '@/@types/controllers.ts'
// import { invoiceSchema, masterInvoicesModel } from '@/database/models/Invoices.ts'
import { Sort } from '@/constants/base.ts'
import { path } from 'ramda'
import { Filter } from 'mongodb'
import mongoose, { Schema } from 'mongoose'
import { DBInvoice } from '@/@types/invoice.ts'

export class InvoicesController implements IController {
    public constructor(
        private readonly masterInvoicesModel: mongoose.PaginateModel<DBInvoice, {}, {}>,
    ) {}

    public async handleRequest(_: Request, response: Response, ctx: RouterContext) {
        const query = helpers.getQuery(ctx)
        const { sortField = 'created_at', sortValue = 'desc' } = query

        const limit = query?.limit ? parseInt(query.limit) : 10
        const page = query?.p ? parseInt(query.p) : 1

        const filter: Filter<Schema> = {}
        const pubkeyOrId = path(['pubkeyOrId'], query)
        if (pubkeyOrId) {
            filter.$or = [
                { pubkey: pubkeyOrId },
                { id: pubkeyOrId },
            ]
        }

        if (['completed', 'pending', 'expired'].includes(query?.status)) {
            filter.status = query.status
        }

        const sort = { [sortField]: Sort.DESC }
        if (['asc', 'desc'].includes(sortValue)) {
            if (sortValue === 'asc') {
                sort[sortField] = Sort.ASC
            }
        }

        response.body = await this.masterInvoicesModel.paginate(filter, { sort, limit, page })
            .then((result) => ({
                ...result,
                docs: result.docs.map((doc) => {
                    return {
                        _id: doc?._id,
                        pubkey: doc?.pubkey,
                        unit: doc?.unit,
                        status: doc?.status,
                        created_at: doc?.created_at,
                        amount_requested: Number(doc?.amount_requested / 1000n),
                        amount_paid: Number(doc?.amount_paid / 1000n),
                    }
                }),
            }))
    }
}
