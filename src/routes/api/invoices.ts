import { Router } from 'oak'

import { withController } from '@/handlers/request-handlers/with-controller-request-handler.ts'
import { createInvoicesController } from '@/factories/controllers/api-controller-factory.ts'

const invoicesRouter = new Router()

invoicesRouter
    .get('/', withController(createInvoicesController))

export default invoicesRouter
