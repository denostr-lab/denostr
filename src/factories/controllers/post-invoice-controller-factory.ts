import { createPaymentsService } from '@/factories/payments-service-factory.ts'
import { createSettings } from '@/factories/settings-factory.ts'
import { IController } from '@/@types/controllers.ts'
import { PostInvoiceController } from '@/controllers/invoices/post-invoice-controller.ts'
import { slidingWindowRateLimiterFactory } from '@/factories/rate-limiter-factory.ts'
import { UserRepository } from '@/repositories/user-repository.ts'

export const createPostInvoiceController = (): IController => {
    const userRepository = new UserRepository(createSettings)
    const paymentsService = createPaymentsService()

    return new PostInvoiceController(
        userRepository,
        paymentsService,
        createSettings,
        slidingWindowRateLimiterFactory,
    )
}
