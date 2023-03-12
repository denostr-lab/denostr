import { Request, Response, Status } from '../../@types/controllers.ts'

import { createLNbitsCallbackController } from '../../factories/lnbits-callback-controller-factory.ts'

export const postLNbitsCallbackRequestHandler = async (
  req: Request,
  res: Response,
) => {
  const controller = createLNbitsCallbackController()

  try {
    await controller.handleRequest(req, res)
  } catch (error) {
    console.error('error while handling LNbits request: %o', error)
    res.status = Status.InternalServerError
    res.headers.set('content-type', 'text/plain')
    res.body = 'Error handling request'
  }
}
