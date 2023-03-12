import { Request, Response, Status, RouterContext, NextFunction } from '../../@types/controllers.ts'

import { createPostInvoiceController } from '../../factories/post-invoice-controller-factory.ts'

export const postInvoiceRequestHandler = async (
  ctx: RouterContext,
  next: NextFunction,
) => {
  const req : Request = ctx.request
  const res : Response = ctx.response
  const controller = createPostInvoiceController()

  try {
    await controller.handleRequest(req, res, ctx)
    await next();
  } catch (error) {
    
    console.error('Unable handle request.', error)
    ctx.throw(Status.InternalServerError, 'Error handling request')
  }
}
