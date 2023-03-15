import { IController } from '../@types/controllers.ts'
import { PostInvoiceController } from '../controllers/invoices/post-invoice-controller.ts'
import { getMasterDbClient } from '../database/client.ts'
import { UserRepository } from '../repositories/user-repository.ts'
import { createPaymentsService } from './payments-service-factory.ts'
import { slidingWindowRateLimiterFactory } from './rate-limiter-factory.ts'
import { createSettings } from './settings-factory.ts'

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
