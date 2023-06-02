import { IController, Request, Response, RouterContext, Status } from '@/@types/controllers.ts'
import { Invoice, InvoiceStatus } from '@/@types/invoice.ts'
import { IPaymentsService } from '@/@types/services.ts'
import { createLogger } from '@/factories/logger-factory.ts'
import { createSettings } from '@/factories/settings-factory.ts'
import { fromZebedeeInvoice } from '@/utils/transform.ts'
import { getRemoteAddress } from '@/utils/http.ts'

const debug = createLogger('zebedee-callback-controller')

export class ZebedeeCallbackController implements IController {
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

        const settings = createSettings()

        const { ipWhitelist = [] } = settings.paymentsProcessors?.zebedee ?? {}
        const remoteAddress = getRemoteAddress(request, settings)
        const paymentProcessor = settings.payments?.processor

        if (ipWhitelist.length && !ipWhitelist.includes(remoteAddress)) {
            debug('unauthorized request from %s to /callbacks/zebedee', remoteAddress)
            response.status = Status.Forbidden
            response.body = 'Forbidden'
            return
        }

        if (paymentProcessor !== 'zebedee') {
            debug('denied request from %s to /callbacks/zebedee which is not the current payment processor', remoteAddress)
            response.status = Status.Forbidden
            response.body = 'Forbidden'
            return
        }

        const invoice = fromZebedeeInvoice(ctx.state.body)

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
        invoice.status = updatedInvoice.status
        updatedInvoice.amountPaid = invoice.amountRequested

        try {
            await this.paymentsService.confirmInvoice({
                id: invoice.id,
                pubkey: invoice.pubkey,
                status: invoice.status,
                confirmedAt: invoice.confirmedAt,
                amountPaid: invoice.amountRequested,
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
