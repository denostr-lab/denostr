import { Context, FormDataReader, helpers, Request, Response, RouterContext as RouterContextRaw, Status, Router } from 'oak'

type RouterContext = RouterContextRaw<string>

export interface IController {
    handleRequest(
        request: Request,
        response: Response,
        ctx?: RouterContext,
    ): Promise<void>
}

type NextFunction = () => Promise<unknown>
export { Context, FormDataReader, helpers, Request, Response, Status, Router }
export type { NextFunction, RouterContext }
