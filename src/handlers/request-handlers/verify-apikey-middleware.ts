import { NextFunction, RouterContext, Status } from '@/@types/controllers.ts'

export const verifyApikeyMiddleware = async (
    ctx: RouterContext,
    next: NextFunction,
) => {
    if (ctx.request.headers.has('x-api-key')) {
        const apiKey = Deno.env.get('API_KEY') || ''
        if (apiKey && ctx.request.headers.get('x-api-key') === apiKey) {
            return await next()
        }
    }

    ctx.response.status = Status.BadRequest
    ctx.response.body = 'Invalid API KEY'
}
