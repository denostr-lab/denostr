import { Request, Response, Status, RouterContext, Context, helpers } from 'koa'

export interface IController {
  handleRequest(request: Request, response: Response, ctx?:RouterContext<string>): Promise<void>
}

type NextFunction = ()=> Promise<unknown>

export {
  Request,
  Response,
  Status,
  Context, 
  helpers
  
};
export type { NextFunction, RouterContext };
