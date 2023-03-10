import express from 'express'

import callbacksRouter from './callbacks/index.ts'
import { getHealthRequestHandler } from '../handlers/request-handlers/get-health-request-handler.ts'
import { getTermsRequestHandler } from '../handlers/request-handlers/get-terms-request-handler.ts'
import invoiceRouter from './invoices/index.ts'
import { rateLimiterMiddleware } from '../handlers/request-handlers/rate-limiter-middleware.ts'
import { rootRequestHandler } from '../handlers/request-handlers/root-request-handler.ts'

const router = express.Router()

router.get('/', rootRequestHandler)
router.get('/healthz', getHealthRequestHandler)
router.get('/terms', getTermsRequestHandler)

router.use('/invoices', rateLimiterMiddleware, invoiceRouter)
router.use('/callbacks', rateLimiterMiddleware, callbacksRouter)

export default router
