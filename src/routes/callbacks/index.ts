import { helpers, Router } from 'oak'

import type { RouterContext } from '../../@types/controllers.ts'
import { NextFunction, Request, Response, Status } from '../../@types/controllers.ts'
import { createLogger } from '../../factories/logger-factory.ts'
import { createSettings } from '../../factories/settings-factory.ts'
import { postLNbitsCallbackRequestHandler } from '../../handlers/request-handlers/post-lnbits-callback-request-handler.ts'
import { postZebedeeCallbackRequestHandler } from '../../handlers/request-handlers/post-zebedee-callback-request-handler.ts'
import { getRemoteAddress } from '../../utils/http.ts'
import { deriveFromSecret, hmacSha256 } from '../../utils/secret.ts'

const debug = createLogger('routes-callbacks')

const router = new Router()
router
    .post('/zebedee', async (ctx: RouterContext, next: NextFunction) => {
        const req: Request = ctx.request
        const res: Response = ctx.response

        const settings = createSettings()
        const { ipWhitelist = [] } = settings.paymentsProcessors?.zebedee ?? {}
        const remoteAddress = getRemoteAddress(req, settings)
        const paymentProcessor = settings.payments?.processor ?? 'null'

        if (ipWhitelist.length && !ipWhitelist.includes(remoteAddress)) {
            debug(
                'unauthorized request from %s to /callbacks/zebedee',
                remoteAddress,
            )
            ctx.throw(Status.Forbidden, 'Forbidden')
        }

        if (paymentProcessor !== 'zebedee') {
            debug(
                'denied request from %s to /callbacks/zebedee which is not the current payment processor',
                remoteAddress,
            )
            ctx.throw(Status.Forbidden, 'Forbidden')
        }

        await postZebedeeCallbackRequestHandler(req, res)
        await next()
    })
    .post('/lnbits', async (ctx: RouterContext, next) => {
        const req: Request = ctx.request
        const res: Response = ctx.response
        const settings = createSettings()
        const remoteAddress = getRemoteAddress(req, settings)
        const paymentProcessor = settings.payments?.processor ?? 'null'

        if (paymentProcessor !== 'lnbits') {
            debug(
                'denied request from %s to /callbacks/lnbits which is not the current payment processor',
                remoteAddress,
            )
            ctx.throw(Status.Forbidden, 'Forbidden')
        }

        let validationPassed = false
        const query = helpers.getQuery(ctx)
        if (
            typeof query.hmac === 'string' &&
            query.hmac.match(/^[0-9]{1,20}:[0-9a-f]{64}$/)
        ) {
            const split = query.hmac.split(':')
            if (
                hmacSha256(deriveFromSecret('lnbits-callback-hmac-key'), split[0])
                    .toString('hex') === split[1]
            ) {
                if (parseInt(split[0]) > Date.now()) {
                    validationPassed = true
                }
            }
        }

        if (!validationPassed) {
            debug('unauthorized request from %s to /callbacks/lnbits', remoteAddress)
            ctx.throw(Status.Forbidden, 'Forbidden')
        }
        await postLNbitsCallbackRequestHandler(req, res, ctx)
        await next()
    })

export default router
