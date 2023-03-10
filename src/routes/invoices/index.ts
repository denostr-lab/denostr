import { Router, urlencoded } from 'express'

import { getInvoiceRequestHandler } from '../../handlers/request-handlers/get-invoice-request-handler.ts'
import { getInvoiceStatusRequestHandler } from '../../handlers/request-handlers/get-invoice-status-request-handler.ts'
import { postInvoiceRequestHandler } from '../../handlers/request-handlers/post-invoice-request-handler.ts'

const invoiceRouter = Router()

invoiceRouter
  .get('/', getInvoiceRequestHandler)
  .get('/:invoiceId/status', getInvoiceStatusRequestHandler)
  .post('/', urlencoded({ extended: true }), postInvoiceRequestHandler)

export default invoiceRouter
