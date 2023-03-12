
import { createLogger } from '../../factories/logger-factory.ts'
import { fromZebedeeInvoice } from '../../utils/transform.ts'
import { IController, Request, Response, Status } from '../../@types/controllers.ts'
import { InvoiceStatus } from '../../@types/invoice.ts'
import { IPaymentsService } from '../../@types/services.ts'

const debug = createLogger('zebedee-callback-controller')

export class ZebedeeCallbackController implements IController {
  public constructor(
    private readonly paymentsService: IPaymentsService,
  ) {}

  // TODO: Validate
  public async handleRequest(
    request: Request,
    response: Response,
  ) {
    debug('request headers: %o', request.headers)
    debug('request body: %O', request.body)

    const invoice = fromZebedeeInvoice(request.body)

    debug('invoice', invoice)

    try {
      if (invoice.bolt11) {
        await this.paymentsService.updateInvoice(invoice)
      }
    } catch (error) {
      console.error(`Unable to persist invoice ${invoice.id}`, error)

      throw error
    }

    if (
      invoice.status !== InvoiceStatus.COMPLETED
      && !invoice.confirmedAt
    ) {
      response.status = Status.OK
      response.body = ''
      return
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
