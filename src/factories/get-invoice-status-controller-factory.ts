import { GetInvoiceStatusController } from '../controllers/invoices/get-invoice-status-controller.ts'
import { getReadReplicaDbClient } from '../database/client.ts'
import { InvoiceRepository } from '../repositories/invoice-repository.ts'

export const createGetInvoiceStatusController = () => {
  const rrDbClient = getReadReplicaDbClient()

  const invoiceRepository = new InvoiceRepository(rrDbClient)

  return new GetInvoiceStatusController(invoiceRepository)
}
