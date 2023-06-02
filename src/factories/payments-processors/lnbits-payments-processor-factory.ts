import { CreateAxiosDefaults } from 'axios'
import { path } from 'ramda'

import { createSettings } from '@/factories/settings-factory.ts'
import { IPaymentsProcessor } from '@/@types/clients.ts'
import { LNbitsPaymentsProcesor } from '@/payments-processors/lnbits-payment-processor.ts'
import { Settings } from '@/@types/settings.ts'
import Config from '@/config/index.ts'
import { HTTPClient } from '@/utils/http.ts'

const getLNbitsAxiosConfig = (settings: Settings): CreateAxiosDefaults<any> => {
    if (!Config.LNBITS_API_KEY) {
        throw new Error('LNBITS_API_KEY must be set to an invoice or admin key.')
    }

    return {
        headers: {
            'content-type': 'application/json',
            'x-api-key': Config.LNBITS_API_KEY,
        },
        baseURL: path(['paymentsProcessors', 'lnbits', 'baseURL'], settings),
        maxRedirects: 1,
    }
}

export const createLNbitsPaymentProcessor = (settings: Settings): IPaymentsProcessor => {
    const callbackBaseURL = path(['paymentsProcessors', 'lnbits', 'callbackBaseURL'], settings) as string | undefined
    if (typeof callbackBaseURL === 'undefined' || callbackBaseURL.indexOf('relay.your-domain.com') >= 0) {
        const error = new Error('Setting paymentsProcessor.lnbits.callbackBaseURL is not configured.')
        console.error('Unable to create payments processor.', error)

        throw error
    }

    const config = getLNbitsAxiosConfig(settings)

    const client = new HTTPClient(config)

    return new LNbitsPaymentsProcesor(client, createSettings)
}
