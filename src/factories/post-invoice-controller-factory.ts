import { createPaymentsService } from './payments-service-factory.ts'
import { createSettings } from './settings-factory.ts'
import { getMasterDbClient } from '../database/client.ts'
import { IController } from '../@types/controllers.ts'
import { PostInvoiceController } from '../controllers/invoices/post-invoice-controller.ts'
import { slidingWindowRateLimiterFactory } from './rate-limiter-factory.ts'
import { UserRepository } from '../repositories/user-repository.ts'

export const createPostInvoiceController = (): IController => {
  const dbClient = getMasterDbClient()
  const userRepository = new UserRepository(dbClient)
  const paymentsService = createPaymentsService()

  return new PostInvoiceController(
    userRepository,
    paymentsService,
    createSettings,
    slidingWindowRateLimiterFactory,
  )
}
