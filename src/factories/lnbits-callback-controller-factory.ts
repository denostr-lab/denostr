import { IController } from '../@types/controllers.ts'
import { LNbitsCallbackController } from '../controllers/callbacks/lnbits-callback-controller.ts'
import { getMasterDbClient } from '../database/client.ts'
import { InvoiceRepository } from '../repositories/invoice-repository.ts'
import { createPaymentsService } from './payments-service-factory.ts'

export const createLNbitsCallbackController = (): IController => {
  return new LNbitsCallbackController(
    createPaymentsService(),
    new InvoiceRepository(getMasterDbClient())
  )
}
