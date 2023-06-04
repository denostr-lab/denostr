import { createPaymentsService } from '@/factories/payments-service-factory.ts'
import { IController } from '@/@types/controllers.ts'
import { InvoiceRepository } from '@/repositories/invoice-repository.ts'
import { LNbitsCallbackController } from '@/controllers/callbacks/lnbits-callback-controller.ts'

export const createLNbitsCallbackController = (): IController => {
    return new LNbitsCallbackController(
        createPaymentsService(),
        new InvoiceRepository(),
    )
}
