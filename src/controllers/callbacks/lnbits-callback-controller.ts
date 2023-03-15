import { IController, Request, Response, RouterContext, Status } from '../../@types/controllers.ts'
import { InvoiceStatus } from '../../@types/invoice.ts'
import { IInvoiceRepository } from '../../@types/repositories.ts'
import { IPaymentsService } from '../../@types/services.ts'
import { createLogger } from '../../factories/logger-factory.ts'

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
        debug('request body: %o', request.body)

        const body = request.body
        if (
            !body || typeof body !== 'object' ||
            typeof body.payment_hash !== 'string' || body.payment_hash.length !== 64
        ) {
            ctx.throw(Status.BadRequest, 'Malformed body')
        }

        const invoice = await this.paymentsService.getInvoiceFromPaymentsProcessor(
            body.payment_hash,
        )
        const storedInvoice = await this.invoiceRepository.findById(
            body.payment_hash,
        )

        if (!storedInvoice) {
            ctx.throw(Status.NotFound, 'No such invoice')
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
            response.body = ''
            return
        }

        if (storedInvoice.status === InvoiceStatus.COMPLETED) {
            ctx.throw(Status.Conflict, 'Invoice is already marked paid')
        }

        invoice.amountPaid = invoice.amountRequested

        try {
            await this.paymentsService.confirmInvoice(invoice)
            await this.paymentsService.sendInvoiceUpdateNotification(invoice)
        } catch (error) {
            console.error(`Unable to confirm invoice ${invoice.id}`, error)

            throw error
        }
        response.status = Status.OK
        response.headers.set('content-type', 'text/plain; charset=utf8')
        response.body = 'OK'
    }
}
