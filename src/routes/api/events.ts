import { Router } from 'oak'

import { withController } from '@/handlers/request-handlers/with-controller-request-handler.ts'
import { createEventsController } from '@/factories/controllers/api-controller-factory.ts'

const eventsRouter = new Router()

eventsRouter
    .get('/', withController(createEventsController))

export default eventsRouter
