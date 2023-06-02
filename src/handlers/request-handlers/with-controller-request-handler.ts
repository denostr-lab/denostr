import { Factory } from '@/@types/base.ts'
import { IController, NextFunction, RouterContext, Status } from '@/@types/controllers.ts'
import { createLogger } from '@/factories/logger-factory.ts'

const debug = createLogger('with-controller')

export const withController = (controllerFactory: Factory<IController>) =>
async (
    ctx: RouterContext,
    next: NextFunction,
) => {
    const response = ctx.response
    try {
        await next()
        return await controllerFactory().handleRequest(ctx.request, response, ctx)
    } catch (err) {
        debug('handleRequest() Error: %o', err)
        response.status = Status.InternalServerError
        response.body = 'Error handling request'
    }
}
