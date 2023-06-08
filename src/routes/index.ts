import { Router } from 'oak'

import { getHealthRequestHandler } from '@/handlers/request-handlers/get-health-request-handler.ts'
import { getTermsRequestHandler } from '@/handlers/request-handlers/get-terms-request-handler.ts'
import { rateLimiterMiddleware } from '@/handlers/request-handlers/rate-limiter-middleware.ts'
import { rootRequestHandler } from '@/handlers/request-handlers/root-request-handler.ts'
import callbacksRouter from '@/routes/callbacks/index.ts'
import invoiceRouter from '@/routes/invoices/index.ts'
import metricsRouter from '@/routes/api/metrics.ts'
import { verifyApikeyMiddleware } from '@/handlers/request-handlers/verify-apikey-middleware.ts'

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

router.use(
    '/invoices',
    rateLimiterMiddleware,
    invoiceRouter.routes(),
    invoiceRouter.allowedMethods(),
)
router.use(
    '/callbacks',
    rateLimiterMiddleware,
    callbacksRouter.routes(),
    callbacksRouter.allowedMethods(),
)
router.use('/api/metrics', 
verifyApikeyMiddleware,
 metricsRouter.routes(), 
 metricsRouter.allowedMethods())

export default router
