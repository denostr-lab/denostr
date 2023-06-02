import { always, applySpec, ifElse, is, path, prop, propEq, propSatisfies } from 'ramda'
import { Buffer } from 'Buffer'

import { IController, Request, Response, RouterContext, Status } from '@/@types/controllers.ts'
import { Invoice, InvoiceStatus } from '@/@types/invoice.ts'
import { IPaymentsService } from '@/@types/services.ts'
import { createLogger } from '@/factories/logger-factory.ts'
import { createSettings } from '@/factories/settings-factory.ts'
import { hmacSha256 } from '@/utils/secret.ts'
import Config from '@/config/index.ts'
import { fromNodelessInvoice } from '@/utils/transform.ts'

const debug = createLogger('nodeless-callback-controller')

export class NodelessCallbackController implements IController {
    public constructor(
        private readonly paymentsService: IPaymentsService,
    ) {}

    // TODO: Validate
    public async handleRequest(
        request: Request,
        response: Response,
        ctx: RouterContext,
    ) {
        debug('callback request headers: %o', request.headers)
        debug('callback request body: %O', ctx.state.body)

        const settings = createSettings()
        const paymentProcessor = settings.payments?.processor

        const body = Buffer.from(await request.body({ type: 'bytes' }).value)
        const expected = hmacSha256(Config.NODELESS_WEBHOOK_SECRET, body).toString('hex')
        const actual = request.headers.get('nodeless-signature')

        if (expected !== actual) {
            console.error('nodeless callback request rejected: signature mismatch:', { expected, actual })
            response.status = Status.Forbidden
            response.body = 'Forbidden'
            return
        }

        if (paymentProcessor !== 'nodeless') {
            debug('denied request from %s to /callbacks/nodeless which is not the current payment processor')
            response.status = Status.Forbidden
            response.body = 'Forbidden'
            return
        }

        const nodelessInvoice = applySpec({
            id: prop('uuid'),
            status: prop('status'),
            satsAmount: prop('amount'),
            metadata: prop('metadata'),
            paidAt: ifElse(
                propEq('status', 'paid'),
                always(new Date().toISOString()),
                always(null),
            ),
            createdAt: ifElse(
                propSatisfies(is(String), 'createdAt'),
                prop('createdAt'),
                path(['metadata', 'createdAt']),
            ),
        })(ctx.state.body)

        debug('nodeless invoice: %O', nodelessInvoice)

        const invoice = fromNodelessInvoice(nodelessInvoice)

        debug('invoice: %O', invoice)

        let updatedInvoice: Invoice
        try {
            updatedInvoice = await this.paymentsService.updateInvoiceStatus(invoice)
            debug('updated invoice: %O', updatedInvoice)
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
            await this.paymentsService.confirmInvoice(invoice)
            await this.paymentsService.sendInvoiceUpdateNotification(updatedInvoice)
        } catch (error) {
            console.error(`Unable to confirm invoice ${invoice.id}`, error)

            throw error
        }

        response.status = Status.OK
        response.body = { status: 'ok' }
    }
}
