import { IController, Request, Response, RouterContext, Status } from '@/@types/controllers.ts'
import { Invoice, InvoiceStatus } from '@/@types/invoice.ts'
import { IPaymentsService } from '@/@types/services.ts'
import { createLogger } from '@/factories/logger-factory.ts'
import { fromOpenNodeInvoice } from '@/utils/transform.ts'

const debug = createLogger('opennode-callback-controller')

export class OpenNodeCallbackController implements IController {
    public constructor(
        private readonly paymentsService: IPaymentsService,
    ) {}

    // TODO: Validate
    public async handleRequest(
        request: Request,
        response: Response,
        ctx: RouterContext,
    ) {
        debug('request headers: %o', request.headers)
        debug('request body: %O', ctx.state.body)

        const invoice = fromOpenNodeInvoice(ctx.state.body) as Invoice

        debug('invoice', invoice)

        let updatedInvoice: Invoice
        try {
            updatedInvoice = await this.paymentsService.updateInvoiceStatus(invoice)
        } catch (error) {
            console.error(`Unable to persist invoice ${invoice.id}`, error)

            throw error
        }

        if (
            updatedInvoice.status !== InvoiceStatus.COMPLETED &&
            !updatedInvoice.confirmedAt
        ) {
            response.status = Status.OK

            return
        }

        invoice.amountPaid = invoice.amountRequested
        updatedInvoice.amountPaid = invoice.amountRequested

        try {
            await this.paymentsService.confirmInvoice({
                id: invoice.id,
                pubkey: invoice.pubkey,
                status: updatedInvoice.status,
                amountPaid: updatedInvoice.amountRequested,
                confirmedAt: updatedInvoice.confirmedAt,
            })
            await this.paymentsService.sendInvoiceUpdateNotification(updatedInvoice)
        } catch (error) {
            console.error(`Unable to confirm invoice ${invoice.id}`, error)

            throw error
        }

        response.status = Status.OK
        response.body = 'OK'
    }
}
