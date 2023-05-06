import { mergeDeepLeft, path, pipe } from 'ramda'

import { IRunnable } from '../@types/base.ts'
import { InvoiceStatus } from '../@types/invoice.ts'
import { IPaymentsService } from '../@types/services.ts'
import { Settings } from '../@types/settings.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { delayMs } from '../utils/misc.ts'

const UPDATE_INVOICE_INTERVAL = 60000

const debug = createLogger('maintenance-worker')

export class MaintenanceWorker implements IRunnable {
    private interval: NodeJS.Timer | undefined

    public constructor(
        private readonly paymentsService: IPaymentsService,
        private readonly settings: () => Settings,
    ) {
    }

    public run(): void {
        this.interval = setInterval(
            () => this.onSchedule(),
            UPDATE_INVOICE_INTERVAL,
        )
    }

    private async onSchedule(): Promise<void> {
        const currentSettings = this.settings()

        if (!path(['payments', 'enabled'], currentSettings)) {
            return
        }

        const invoices = await this.paymentsService.getPendingInvoices()
        debug('found %d pending invoices', invoices.length)
        const delay = () => delayMs(100 + Math.floor(Math.random() * 10))

        let successful = 0

        for (const invoice of invoices) {
            debug('invoice %s: %o', invoice.id, invoice)
            try {
                debug('getting invoice %s from payment processor: %o', invoice.id, invoice)
                const updatedInvoice = await this.paymentsService.getInvoiceFromPaymentsProcessor(invoice)
                await delay()
                debug('updating invoice status %s: %o', updatedInvoice.id, updatedInvoice)
                await this.paymentsService.updateInvoiceStatus(updatedInvoice)

                if (
                    invoice.status !== updatedInvoice.status &&
                    updatedInvoice.status == InvoiceStatus.COMPLETED &&
                    updatedInvoice.confirmedAt
                ) {
                    debug(
                        'confirming invoice %s & notifying %s',
                        invoice.id,
                        invoice.pubkey,
                    )

                    const update = pipe(
                        mergeDeepLeft(updatedInvoice),
                        mergeDeepLeft({ amountPaid: invoice.amountRequested }),
                    )(invoice)

                    await Promise.all([
                        this.paymentsService.confirmInvoice(update),
                        this.paymentsService.sendInvoiceUpdateNotification(update),
                    ])

                    await delay()
                }
                successful++
            } catch (error) {
                console.error(
                    'Unable to update invoice from payment processor. Reason:',
                    error,
                )
            }

            debug(
                'updated %d of %d invoices successfully',
                successful,
                invoices.length,
            )
        }
    }

    public close(callback?: () => void) {
        debug('closing')
        clearInterval(this.interval)
        if (typeof callback === 'function') {
            callback()
        }
    }
}
