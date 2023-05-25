import { Router } from 'oak'

import { createGetInvoiceController } from '@/factories/controllers/get-invoice-controller-factory.ts'
import { createGetInvoiceStatusController } from '@/factories/controllers/get-invoice-status-controller-factory.ts'
import { createPostInvoiceController } from '@/factories/controllers/post-invoice-controller-factory.ts'
import { withController } from '@/handlers/request-handlers/with-controller-request-handler.ts'
import { bodyParserMiddleware } from '@/handlers/request-handlers/body-parser-middleware.ts'

const invoiceRouter = new Router()

invoiceRouter
    .get('/', withController(createGetInvoiceController))
    .get('/:invoiceId/status', withController(createGetInvoiceStatusController))
    .post('/', bodyParserMiddleware, withController(createPostInvoiceController))

export default invoiceRouter
