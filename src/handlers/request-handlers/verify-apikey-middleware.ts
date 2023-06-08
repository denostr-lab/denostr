import { NextFunction, Request, RouterContext, Status } from '@/@types/controllers.ts'
// import { createLogger } from '@/factories/logger-factory.ts'

// const debug = createLogger('verify-apikey-middleware')

export const verifyApikeyMiddleware = async (
    ctx: RouterContext,
    next: NextFunction,
) => {
    ctx.state.body = {}
    const request: Request = ctx.request

    if (request.headers.has('x-api-key') && request.headers.get('x-api-key') == Deno.env.get('API_KEY')) {
        ctx.response.status = Status.OK
        ctx.response.headers.set('content-type', 'application/json')
    } else {
        ctx.response.status = Status.BadRequest
        ctx.response.body = 'Invalid API KEY'
    }

    await next()
}
