import { Router } from '@/@types/controllers.ts'
import { createLNbitsCallbackController } from '@/factories/controllers/lnbits-callback-controller-factory.ts'
// import { createNodelessCallbackController } from '@/factories/controllers/nodeless-callback-controller-factory.ts'
// import { createOpenNodeCallbackController } from '@/factories/controllers/opennode-callback-controller-factory.ts'
import { createZebedeeCallbackController } from '@/factories/controllers/zebedee-callback-controller-factory.ts'
import { withController } from '@/handlers/request-handlers/with-controller-request-handler.ts'
import { bodyParserMiddleware } from '@/handlers/request-handlers/body-parser-middleware.ts'

const router = new Router()
router.use(bodyParserMiddleware)

router
    .post('/zebedee', withController(createZebedeeCallbackController))
    .post('/lnbits', withController(createLNbitsCallbackController))
// .post('/nodeless', withController(createNodelessCallbackController))
// .post('/opennode', withController(createOpenNodeCallbackController))

export default router
