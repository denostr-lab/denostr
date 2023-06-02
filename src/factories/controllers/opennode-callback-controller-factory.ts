import { createPaymentsService } from '@/factories/payments-service-factory.ts'
import { IController } from '@/@types/controllers.ts'
import { OpenNodeCallbackController } from '@/controllers/callbacks/opennode-callback-controller.ts'

export const createOpenNodeCallbackController = (): IController => {
    return new OpenNodeCallbackController(
        createPaymentsService(),
    )
}
