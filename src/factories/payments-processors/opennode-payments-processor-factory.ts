import { CreateAxiosDefaults } from 'axios'
import { path } from 'ramda'

import { createSettings } from '@/factories/settings-factory.ts'
import { IPaymentsProcessor } from '@/@types/clients.ts'
import { OpenNodePaymentsProcesor } from '@/payments-processors/opennode-payments-processor.ts'
import { Settings } from '@/@types/settings.ts'
import Config from '@/config/index.ts'
import { HTTPClient } from '@/utils/http.ts'

const getOpenNodeAxiosConfig = (settings: Settings): CreateAxiosDefaults<any> => {
    if (!Config.OPENNODE_API_KEY) {
        const error = new Error('OPENNODE_API_KEY must be set.')
        console.error('Unable to get OpenNode config.', error)
        throw error
    }

    return {
        headers: {
            'content-type': 'application/json',
            'authorization': Config.OPENNODE_API_KEY,
        },
        baseURL: path(['paymentsProcessors', 'opennode', 'baseURL'], settings),
        maxRedirects: 1,
    }
}

export const createOpenNodePaymentsProcessor = (settings: Settings): IPaymentsProcessor => {
    const callbackBaseURL = path(['paymentsProcessors', 'opennode', 'callbackBaseURL'], settings) as string | undefined
    if (typeof callbackBaseURL === 'undefined' || callbackBaseURL.indexOf('nostream.your-domain.com') >= 0) {
        const error = new Error('Setting paymentsProcessor.opennode.callbackBaseURL is not configured.')
        console.error('Unable to create payments processor.', error)

        throw error
    }

    const config = getOpenNodeAxiosConfig(settings)
    const client = new HTTPClient(config)

    return new OpenNodePaymentsProcesor(client, createSettings)
}
