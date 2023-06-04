import { GetInvoiceStatusController } from '@/controllers/invoices/get-invoice-status-controller.ts'
import { InvoiceRepository } from '@/repositories/invoice-repository.ts'

export const createGetInvoiceStatusController = () => {
    const invoiceRepository = new InvoiceRepository()

    return new GetInvoiceStatusController(invoiceRepository)
}
