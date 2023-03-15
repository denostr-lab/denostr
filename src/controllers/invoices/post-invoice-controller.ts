import { readFileSync } from 'node:fs'

import { path } from 'ramda'

import { helpers, IController, Request, Response, RouterContext, Status } from '../../@types/controllers.ts'
import { Invoice } from '../../@types/invoice.ts'
import { IUserRepository } from '../../@types/repositories.ts'
import { IPaymentsService } from '../../@types/services.ts'
import { FeeSchedule, Settings } from '../../@types/settings.ts'
import { IRateLimiter } from '../../@types/utils.ts'
import { createLogger } from '../../factories/logger-factory.ts'
import { getPublicKey, getRelayPrivateKey } from '../../utils/event.ts'
import { getRemoteAddress } from '../../utils/http.ts'
import { fromBech32, toBech32 } from '../../utils/transform.ts'

let pageCache: string

const debug = createLogger('post-invoice-controller')

export class PostInvoiceController implements IController {
    public constructor(
        private readonly userRepository: IUserRepository,
        private readonly paymentsService: IPaymentsService,
        private readonly settings: () => Settings,
        private readonly rateLimiter: () => Promise<IRateLimiter>,
    ) {}

    public async handleRequest(
        request: Request,
        response: Response,
        ctx: RouterContext,
    ): Promise<void> {
        if (!pageCache) {
            pageCache = readFileSync('./resources/invoices.html', 'utf8')
        }
        const params = helpers.getQuery(ctx)
        debug('params: %o', params)
        debug('body: %o', request.body)

        const currentSettings = this.settings()

        const {
            info: { name: relayName, relay_url: relayUrl },
        } = currentSettings

        const limited = await this.isRateLimited(request, currentSettings)
        if (limited) {
            ctx.throw(Status.TooManyRequests, 'Too many requests')
        }

        if (!request.body || typeof request.body !== 'object') {
            ctx.throw(Status.BadRequest, 'Invalid request')
        }

        const tosAccepted = request.body?.tosAccepted === 'yes'

        if (!tosAccepted) {
            ctx.throw(Status.BadRequest, 'ToS agreement: not accepted')
        }

        const isAdmissionInvoice = request.body?.feeSchedule === 'admission'
        if (!isAdmissionInvoice) {
            ctx.throw(Status.BadRequest, 'Invalid fee')
        }

        const pubkeyRaw = path(['body', 'pubkey'], request)

        let pubkey: string
        if (typeof pubkeyRaw !== 'string') {
            ctx.throw(Status.BadRequest, 'Invalid pubkey: missing')
        } else if (/^[0-9a-f]{64}$/.test(pubkeyRaw)) {
            pubkey = pubkeyRaw
        } else if (/^npub1/.test(pubkeyRaw)) {
            try {
                pubkey = fromBech32(pubkeyRaw)
            } catch {
                ctx.throw(Status.BadRequest, 'Invalid pubkey: invalid npub')
            }
        } else {
            ctx.throw(Status.BadRequest, 'Invalid pubkey: unknown format')
        }

        const isApplicableFee = (feeSchedule: FeeSchedule) =>
            feeSchedule.enabled &&
            !feeSchedule.whitelists?.pubkeys?.some((prefix) => pubkey.startsWith(prefix))
        const admissionFee = currentSettings.payments?.feeSchedules.admission
            .filter(isApplicableFee)

        if (!Array.isArray(admissionFee) || !admissionFee.length) {
            ctx.throw(Status.BadRequest, 'No admission fee required')
            return
        }

        const minBalance = currentSettings.limits?.event?.pubkey?.minBalance
        const user = await this.userRepository.findByPubkey(pubkey)
        if (
            user && user.isAdmitted && (!minBalance || user.balance >= minBalance)
        ) {
            ctx.throw(Status.BadRequest, 'User is already admitted.')
            return
        }

        let invoice: Invoice
        const amount = admissionFee.reduce(
            (sum, fee) => sum + BigInt(fee.amount),
            0n,
        )
        try {
            const description = `${relayName} Admission Fee for ${toBech32('npub')(pubkey)}`

            invoice = await this.paymentsService.createInvoice(
                pubkey,
                amount,
                description,
            )

            await this.paymentsService.sendNewInvoiceNotification(invoice)
        } catch (error) {
            console.error('Unable to create invoice. Reason:', error)
            ctx.throw(Status.BadRequest, 'Unable to create invoice')
            return
        }

        const relayPrivkey = getRelayPrivateKey(relayUrl)
        const relayPubkey = getPublicKey(relayPrivkey)

        const replacements = {
            name: relayName,
            reference: invoice.id,
            relay_url: relayUrl,
            pubkey,
            relay_pubkey: relayPubkey,
            expires_at: invoice.expiresAt?.toISOString(),
            invoice: invoice.bolt11,
            amount: amount / 1000n,
        }

        const body = Object
            .entries(replacements)
            .reduce(
                (body, [key, value]) => body.replaceAll(`{{${key}}}`, value.toString()),
                pageCache,
            )
        response.status = Status.OK
        response.headers.set('Content-Type', 'text/html; charset=utf8')
        response.body = body

        return
    }

    public async isRateLimited(request: Request, settings: Settings) {
        const rateLimits = path(['limits', 'invoice', 'rateLimits'], settings)
        if (!Array.isArray(rateLimits) || !rateLimits.length) {
            return false
        }

        const ipWhitelist = path(['limits', 'invoice', 'ipWhitelist'], settings)
        const remoteAddress = getRemoteAddress(request, settings)

        let limited = false
        if (Array.isArray(ipWhitelist) && !ipWhitelist.includes(remoteAddress)) {
            const rateLimiter = await this.rateLimiter()
            for (const { rate, period } of rateLimits) {
                if (
                    await rateLimiter.hit(`${remoteAddress}:invoice:${period}`, 1, {
                        period,
                        rate,
                    })
                ) {
                    debug(
                        'rate limited %s: %d in %d milliseconds',
                        remoteAddress,
                        rate,
                        period,
                    )
                    limited = true
                }
            }
        }
        return limited
    }
}
