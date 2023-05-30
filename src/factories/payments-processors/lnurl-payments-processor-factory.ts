import { path } from 'ramda'

import { createSettings } from '@/factories/settings-factory.ts'
import { IPaymentsProcessor } from '@/@types/clients.ts'
import { LnurlPaymentsProcesor } from '@/payments-processors/lnurl-payments-processor.ts'
import { Settings } from '@/@types/settings.ts'
import { HTTPClient } from '@/utils/http.ts'

export const createLnurlPaymentsProcessor = (settings: Settings): IPaymentsProcessor => {
    const invoiceURL = path(['paymentsProcessors', 'lnurl', 'invoiceURL'], settings) as string | undefined
    if (typeof invoiceURL === 'undefined') {
        throw new Error('Unable to create payments processor: Setting paymentsProcessor.lnurl.invoiceURL is not configured.')
    }

    const client = new HTTPClient()

    return new LnurlPaymentsProcesor(client, createSettings)
}
