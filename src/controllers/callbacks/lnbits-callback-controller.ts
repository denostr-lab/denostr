import { helpers, IController, Request, Response, RouterContext, Status } from '@/@types/controllers.ts'
import { Invoice, InvoiceStatus } from '@/@types/invoice.ts'
import { IInvoiceRepository } from '@/@types/repositories.ts'
import { IPaymentsService } from '@/@types/services.ts'
import { createLogger } from '@/factories/logger-factory.ts'
import { createSettings } from '@/factories/settings-factory.ts'
import { deriveFromSecret, hmacSha256 } from '@/utils/secret.ts'
import { getRemoteAddress } from '@/utils/http.ts'

const debug = createLogger('lnbits-callback-controller')

export class LNbitsCallbackController implements IController {
    public constructor(
        private readonly paymentsService: IPaymentsService,
        private readonly invoiceRepository: IInvoiceRepository,
    ) {}

    // TODO: Validate
    public async handleRequest(
        request: Request,
        response: Response,
        ctx: RouterContext,
    ) {
        debug('request headers: %o', request.headers)
        debug('request body: %o', ctx.state.body)

        const settings = createSettings()
        const remoteAddress = getRemoteAddress(request, settings)
        const paymentProcessor = settings.payments?.processor ?? 'null'

        if (paymentProcessor !== 'lnbits') {
            debug('denied request from %s to /callbacks/lnbits which is not the current payment processor', remoteAddress)
            response.status = Status.Forbidden
            response.body = 'Forbidden'
            return
        }

        let validationPassed = false

        const requestQuery = helpers.getQuery(ctx)
        if (typeof requestQuery.hmac === 'string' && requestQuery.hmac.match(/^[0-9]{1,20}:[0-9a-f]{64}$/)) {
            const split = requestQuery.hmac.split(':')
            if (hmacSha256(deriveFromSecret('lnbits-callback-hmac-key'), split[0]).toString('hex') === split[1]) {
                if (parseInt(split[0]) > Date.now()) {
                    validationPassed = true
                }
            }
        }

        if (!validationPassed) {
            debug('unauthorized request from %s to /callbacks/lnbits', remoteAddress)
            response.status = Status.Forbidden
            response.body = 'Forbidden'
            return
        }

        const body = ctx.state.body
        if (
            !body || typeof body !== 'object' ||
            typeof body.payment_hash !== 'string' || body.payment_hash.length !== 64
        ) {
            ctx.response.status = Status.BadRequest
            ctx.response.body = 'Malformed body'
            return
        }

        const invoice = await this.paymentsService.getInvoiceFromPaymentsProcessor(
            body.payment_hash,
        )
        const storedInvoice = await this.invoiceRepository.findById(
            body.payment_hash,
        )

        if (!storedInvoice) {
            ctx.response.status = Status.NotFound
            ctx.response.body = 'No such invoice'
            return
        }

        try {
            await this.paymentsService.updateInvoice(invoice)
        } catch (error) {
            console.error(`Unable to persist invoice ${invoice.id}`, error)
            throw error
        }

        if (
            invoice.status !== InvoiceStatus.COMPLETED &&
            !invoice.confirmedAt
        ) {
            response.status = Status.OK
            response.headers.set('content-type', 'text/plain; charset=utf8')
            response.body = 'OK'
            return
        }

        if (storedInvoice.status === InvoiceStatus.COMPLETED) {
            ctx.response.status = Status.Conflict
            ctx.response.body = 'Invoice is already marked paid'
            return
        }

        invoice.amountPaid = invoice.amountRequested

        try {
            await this.paymentsService.confirmInvoice(invoice as Invoice)
            await this.paymentsService.sendInvoiceUpdateNotification(invoice as Invoice)
        } catch (error) {
            console.error(`Unable to confirm invoice ${invoice.id}`, error)

            throw error
        }
        response.status = Status.OK
        response.headers.set('content-type', 'text/plain; charset=utf8')
        response.body = 'OK'
    }
}
