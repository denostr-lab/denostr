import { Context, helpers, Request, Response, RouterContext as RouterContextRaw, Status } from 'oak'

type RouterContext = RouterContextRaw<string>

export interface IController {
    handleRequest(
        request: Request,
        response: Response,
        ctx?: RouterContext,
    ): Promise<void>
}

type NextFunction = () => Promise<unknown>
export { Context, helpers, Request, Response, Status }
export type { NextFunction, RouterContext }
