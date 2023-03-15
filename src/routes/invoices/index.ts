import { Router } from 'oak'

import { getInvoiceRequestHandler } from '../../handlers/request-handlers/get-invoice-request-handler.ts'
import { getInvoiceStatusRequestHandler } from '../../handlers/request-handlers/get-invoice-status-request-handler.ts'
import { postInvoiceRequestHandler } from '../../handlers/request-handlers/post-invoice-request-handler.ts'

const invoiceRouter = new Router()

invoiceRouter
    .get('/', getInvoiceRequestHandler)
    .get('/:invoiceId/status', getInvoiceStatusRequestHandler)
    .post('/', postInvoiceRequestHandler)

export default invoiceRouter
