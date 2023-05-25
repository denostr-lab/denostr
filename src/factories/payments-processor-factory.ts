import { IPaymentsProcessor } from '@/@types/clients.ts'
import { NullPaymentsProcessor } from '@/payments-processors/null-payments-processor.ts'
import { createLogger } from '@/factories/logger-factory.ts'
import { createSettings } from '@/factories/settings-factory.ts'
import { createLNbitsPaymentProcessor } from '@/factories/payments-processors/lnbits-payments-processor-factory.ts'
import { createLnurlPaymentsProcessor } from '@/factories/payments-processors/lnurl-payments-processor-factory.ts'
import { createNodelessPaymentsProcessor } from '@/factories/payments-processors/nodeless-payments-processor-factory.ts'
import { createOpenNodePaymentsProcessor } from '@/factories/payments-processors/opennode-payments-processor-factory.ts'
import { createZebedeePaymentsProcessor } from '@/factories/payments-processors/zebedee-payments-processor-factory.ts'

const debug = createLogger('create-payments-processor')

export const createPaymentsProcessor = (): IPaymentsProcessor => {
    debug('create payments processor')
    const settings = createSettings()
    debug('payments = %o', settings.payments?.processor, settings.payments?.enabled)
    if (!settings.payments?.enabled) {
        return new NullPaymentsProcessor()
    }

    switch (settings.payments?.processor) {
        case 'lnurl':
            return createLnurlPaymentsProcessor(settings)
        case 'zebedee':
            return createZebedeePaymentsProcessor(settings)
        case 'lnbits':
            return createLNbitsPaymentProcessor(settings)
        case 'nodeless':
            return createNodelessPaymentsProcessor(settings)
        case 'opennode':
            return createOpenNodePaymentsProcessor(settings)
        default:
            return new NullPaymentsProcessor()
    }
}
