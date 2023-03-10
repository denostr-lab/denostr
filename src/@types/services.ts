import { Invoice } from './invoice.ts'
import { Pubkey } from './base.ts'

export interface IPaymentsService {
  getInvoiceFromPaymentsProcessor(invoiceId: string): Promise<Invoice>
  createInvoice(
    pubkey: Pubkey,
    amount: bigint,
    description: string,
  ): Promise<Invoice>
  updateInvoice(invoice: Invoice): Promise<void>
  confirmInvoice(
    invoice: Pick<Invoice, 'id' | 'amountPaid' | 'confirmedAt'>,
  ): Promise<void>
  sendNewInvoiceNotification(invoice: Invoice): Promise<void>
  sendInvoiceUpdateNotification(invoice: Invoice): Promise<void>
  getPendingInvoices(): Promise<Invoice[]>
}
