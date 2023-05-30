import { CreateAxiosDefaults } from 'axios'
import { path } from 'ramda'

import { createSettings } from '@/factories/settings-factory.ts'
import { IPaymentsProcessor } from '@/@types/clients.ts'
import { NodelessPaymentsProcesor } from '@/payments-processors/nodeless-payments-processor.ts'
import { Settings } from '@/@types/settings.ts'
import Config from '@/config/index.ts'
import { HTTPClient } from '@/utils/http.ts'

const getNodelessAxiosConfig = (settings: Settings): CreateAxiosDefaults<any> => {
    if (!Config.NODELESS_API_KEY) {
        const error = new Error('NODELESS_API_KEY must be set.')
        console.error('Unable to get Nodeless config.', error)
        throw error
    }

    return {
        headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${Config.NODELESS_API_KEY}`,
            'accept': 'application/json',
        },
        baseURL: path(['paymentsProcessors', 'nodeless', 'baseURL'], settings),
        maxRedirects: 1,
    }
}

export const createNodelessPaymentsProcessor = (settings: Settings): IPaymentsProcessor => {
    const client = new HTTPClient(getNodelessAxiosConfig(settings))

    return new NodelessPaymentsProcesor(client, createSettings)
}
