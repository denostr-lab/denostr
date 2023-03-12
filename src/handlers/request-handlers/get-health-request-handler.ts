import { NextFunction, Response, RouterContext, Status } from '../../@types/controllers.ts'

export const getHealthRequestHandler = async(ctx: RouterContext<string>, next: NextFunction) => {
  const res : Response = ctx.response
  res.status = Status.OK
  res.headers.set('content-type', 'text/plain; charset=utf8')
  res.body = 'OK'
  await next()
}
