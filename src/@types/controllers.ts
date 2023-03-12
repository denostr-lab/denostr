import { Context, helpers, Request, Response, RouterContext as RouterContextRaw, Status } from 'oak'

type RouterContext = RouterContextRaw<string>

export interface IController {
  handleRequest(request: Request, response: Response, ctx?: RouterContext): Promise<void>
}

type NextFunction = () => Promise<unknown>
export {
  Request,
  Response,
  Status,
  Context,
  helpers,

}
export type { NextFunction, RouterContext }
