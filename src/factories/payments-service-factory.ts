import { getMasterDbClient } from '../database/client.ts'
import { EventRepository } from '../repositories/event-repository.ts'
import { InvoiceRepository } from '../repositories/invoice-repository.ts'
import { UserRepository } from '../repositories/user-repository.ts'
import { PaymentsService } from '../services/payments-service.ts'
import { createPaymentsProcessor } from './payments-processor-factory.ts'
import { createSettings } from './settings-factory.ts'

export const createPaymentsService = () => {
    const dbClient = getMasterDbClient()
    const invoiceRepository = new InvoiceRepository()
    const userRepository = new UserRepository(createSettings)
    const paymentsProcessor = createPaymentsProcessor()
    const eventRepository = new EventRepository(createSettings)

    return new PaymentsService(
        dbClient,
        paymentsProcessor,
        userRepository,
        invoiceRepository,
        eventRepository,
        createSettings,
    )
}
