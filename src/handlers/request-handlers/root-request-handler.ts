import { path } from 'ramda'

import packageJson from '../../../package.json' assert { type: 'json' }
import { NextFunction, Request, Response, RouterContext, Status } from '../../@types/controllers.ts'
import { FeeSchedule } from '../../@types/settings.ts'
import { createSettings } from '../../factories/settings-factory.ts'

export const rootRequestHandler = async (
    ctx: RouterContext,
    next: NextFunction,
) => {
    const settings = createSettings()
    const request: Request = ctx.request
    const response: Response = ctx.response
    if (request.headers.get('accept') === 'application/nostr+json') {
        const {
            info: { name, description, pubkey, contact, relay_url },
        } = settings

        const paymentsUrl = new URL(relay_url)
        paymentsUrl.protocol = paymentsUrl.protocol === 'wss:' ? 'https:' : 'http:'
        paymentsUrl.pathname = '/invoices'

        const relayInformationDocument = {
            name,
            description,
            pubkey,
            contact,
            supported_nips: packageJson.supportedNips,
            supported_nip_extensions: packageJson.supportedNipExtensions,
            software: packageJson.repository.url,
            version: packageJson.version,
            limitation: {
                max_message_length: settings.network.maxPayloadSize,
                max_subscriptions: settings.limits?.client?.subscription
                    ?.maxSubscriptions,
                max_filters: settings.limits?.client?.subscription?.maxFilters,
                max_limit: 5000,
                max_subid_length: 256,
                min_prefix: 4,
                max_event_tags: 2500,
                max_content_length: 102400,
                min_pow_difficulty: settings.limits?.event?.eventId?.minLeadingZeroBits,
                auth_required: false,
                payment_required: settings.payments?.enabled,
            },
            payments_url: paymentsUrl.toString(),
            fees: Object
                .getOwnPropertyNames(settings.payments?.feeSchedules)
                .reduce((prev, feeName) => {
                    const feeSchedules = settings.payments?.feeSchedules
                        ?.[feeName] as FeeSchedule[]

                    return {
                        ...prev,
                        [feeName]: feeSchedules.reduce(
                            (fees, fee) => (fee.enabled) ? [...fees, { amount: fee.amount, unit: 'msats' }] : fees,
                            [],
                        ),
                    }
                }, {} as Record<string, { amount: number; unit: string }>),
        }
        response.status = Status.OK

        response.headers.set('content-type', 'application/nostr+json')
        response.headers.set('access-control-allow-origin', '*')
        response.body = relayInformationDocument
        await next()
        return
    }

    const admissionFeeEnabled = path([
        'payments',
        'feeSchedules',
        'admission',
        '0',
        'enabled',
    ])(settings)

    if (admissionFeeEnabled) {
        response.status = Status.MovedPermanently
        response.redirect('/invoices')
    } else {
        response.status = Status.OK
        response.headers.set('content-type', 'text/plain; charset=utf8')
        response.body = 'Please use a Nostr client to connect.'
        await next()
    }
}
