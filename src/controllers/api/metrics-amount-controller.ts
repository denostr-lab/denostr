import { helpers, IController, Request, Response, RouterContext } from '@/@types/controllers.ts'
import { AmountRow } from '@/@types/api.ts'
import { readReplicaInvoicesModel } from '@/database/models/Invoices.ts'
import { DBInvoice } from '@/@types/invoice.ts'

export class MetricsAmountController implements IController {
    public constructor(
        private readonly readReplicaInvoicesModel: mongoose.InvoicesModel<DBInvoice, {}, {}>,
    ) {}
    public async handleRequest(_: Request, response: Response, ctx: RouterContext) {
        // const response = ctx.response
        const pipline = [
            {
                $match: { status: 'completed' },
            },
            {
                $group: {
                    _id: '$unit',
                    total: {
                        $sum: '$amount_paid',
                    },
                },
            },
        ]

        const amountArr: AmountRow[] = await this.readReplicaInvoicesModel.aggregate(pipline)

        let amount: number = 0
        for (let i = 0; i < amountArr.length; i++) {
            if (amountArr[i]._id == 'msats') {
                amount += amountArr[i].total / 1000
            }
            if (amountArr[i]._id == 'sats') {
                amount += amountArr[i].total
            }
        }

        response.type = 'json'
        response.body = {
            status: 'ok',
            total: amount,
        }
    }
}
