import axios, { CreateAxiosDefaults } from 'npm:axios@1.2.6'
import { path } from 'ramda'

import { IPaymentsProcessor } from '../@types/clients.ts'
import { Settings } from '../@types/settings.ts'
import Config from '../config/index.ts'
import { LNbitsPaymentsProcesor } from '../payments-processors/lnbits-payment-processor.ts'
import { NullPaymentsProcessor } from '../payments-processors/null-payments-processor.ts'
import { PaymentsProcessor } from '../payments-processors/payments-procesor.ts'
import { ZebedeePaymentsProcesor } from '../payments-processors/zebedee-payments-processor.ts'
import { createLogger } from './logger-factory.ts'
import { createSettings } from './settings-factory.ts'

const debug = createLogger('create-payments-processor')

const getZebedeeAxiosConfig = (
    settings: Settings,
): CreateAxiosDefaults<any> => {
    if (!Config.ZEBEDEE_API_KEY) {
        const error = new Error('ZEBEDEE_API_KEY must be set.')
        console.error('Unable to get Zebedee config.', error)
        throw error
    }

    return {
        headers: {
            'content-type': 'application/json',
            'apikey': Config.ZEBEDEE_API_KEY,
        },
        baseURL: path(['paymentsProcessors', 'zebedee', 'baseURL'], settings),
        maxRedirects: 1,
    }
}

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

const createZebedeePaymentsProcessor = (
    settings: Settings,
): IPaymentsProcessor => {
    const callbackBaseURL = path([
        'paymentsProcessors',
        'zebedee',
        'callbackBaseURL',
    ], settings) as string | undefined
    if (
        typeof callbackBaseURL === 'undefined' ||
        callbackBaseURL.indexOf('denostr.your-domain.com') >= 0
    ) {
        const error = new Error(
            'Setting paymentsProcessor.zebedee.callbackBaseURL is not configured.',
        )
        console.error('Unable to create payments processor.', error)

        throw error
    }

    if (
        !Array.isArray(settings.paymentsProcessors?.zebedee?.ipWhitelist) ||
        !settings.paymentsProcessors?.zebedee?.ipWhitelist?.length
    ) {
        const error = new Error(
            'Setting paymentsProcessor.zebedee.ipWhitelist is empty.',
        )
        console.error('Unable to create payments processor.', error)

        throw error
    }

    const config = getZebedeeAxiosConfig(settings)
    debug('config: %o', config)
    const client = axios.create(config)

    const zpp = new ZebedeePaymentsProcesor(client, createSettings)

    return new PaymentsProcessor(zpp)
}

const createLNbitsPaymentProcessor = (
    settings: Settings,
): IPaymentsProcessor => {
    const callbackBaseURL = path([
        'paymentsProcessors',
        'lnbits',
        'callbackBaseURL',
    ], settings) as string | undefined
    if (
        typeof callbackBaseURL === 'undefined' ||
        callbackBaseURL.indexOf('denostr.your-domain.com') >= 0
    ) {
        const error = new Error(
            'Setting paymentsProcessor.lnbits.callbackBaseURL is not configured.',
        )
        console.error('Unable to create payments processor.', error)

        throw error
    }

    const config = getLNbitsAxiosConfig(settings)
    debug('config: %o', config)
    const client = axios.create(config)

    const pp = new LNbitsPaymentsProcesor(client, createSettings)

    return new PaymentsProcessor(pp)
}

export const createPaymentsProcessor = (): IPaymentsProcessor => {
    debug('create payments processor')
    const settings = createSettings()
    if (!settings.payments?.enabled) {
        return new NullPaymentsProcessor()
    }

    switch (settings.payments?.processor) {
        case 'zebedee':
            return createZebedeePaymentsProcessor(settings)
        case 'lnbits':
            return createLNbitsPaymentProcessor(settings)
        default:
            return new NullPaymentsProcessor()
    }
}
