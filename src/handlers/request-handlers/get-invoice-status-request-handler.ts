import { Request, Response } from 'express'

import { createGetInvoiceStatusController } from '../../factories/get-invoice-status-controller-factory.ts'

export const getInvoiceStatusRequestHandler = async (req: Request, res: Response) => {
  const controller = createGetInvoiceStatusController()

  await controller.handleRequest(req, res)
}
