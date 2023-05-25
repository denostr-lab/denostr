import { createPaymentsService } from '@/factories/payments-service-factory.ts'
import { IController } from '@/@types/controllers.ts'
import { NodelessCallbackController } from '@/controllers/callbacks/nodeless-callback-controller.ts'

export const createNodelessCallbackController = (): IController =>
    new NodelessCallbackController(
        createPaymentsService(),
    )
