import { Router } from 'oak'

import callbacksRouter from './callbacks/index.ts'
import { getHealthRequestHandler } from '../handlers/request-handlers/get-health-request-handler.ts'
import { getTermsRequestHandler } from '../handlers/request-handlers/get-terms-request-handler.ts'
import invoiceRouter from './invoices/index.ts'
import { rateLimiterMiddleware } from '../handlers/request-handlers/rate-limiter-middleware.ts'
import { rootRequestHandler } from '../handlers/request-handlers/root-request-handler.ts'

const router = new Router()

router.get('/', rootRequestHandler)
router.get('/:name', async (context, next) => {
    try {
        await context.send({
            root: `${Deno.cwd()}/resources/`,
        })
    } catch {
        await next()
    }
})
router.get('/css/:name', async (context, next) => {
    try {
        await context.send({
            root: `${Deno.cwd()}/resources/`,
        })
    } catch {
        await next()
    }
})
router.get('/healthz', getHealthRequestHandler)
router.get('/terms', getTermsRequestHandler)

router.use('/invoices', rateLimiterMiddleware, invoiceRouter.routes(), invoiceRouter.allowedMethods())
router.use('/callbacks', rateLimiterMiddleware, callbacksRouter.routes(), callbacksRouter.allowedMethods())

export default router
