import { NextFunction, Request, RouterContext, Status } from '@/@types/controllers.ts'
import { createLogger } from '@/factories/logger-factory.ts'

const debug = createLogger('body-parser-middleware')

export const bodyParserMiddleware = async (
    ctx: RouterContext,
    next: NextFunction,
) => {
    ctx.state.body = {}
    const request: Request = ctx.request
    const result = request.body()
    switch (result.type) {
        case 'text':
            {
                try {
                    ctx.state.body = JSON.parse(await result.value)
                } catch {
                    ctx.response.status = Status.BadRequest
                    ctx.response.body = 'Invalid JSON string'
                    return
                }
            }
            break
        case 'json':
            {
                try {
                    ctx.state.body = await result.value
                } catch {
                    ctx.response.status = Status.BadRequest
                    ctx.response.body = 'Invalid JSON string'
                    return
                }
            }
            break
        case 'form':
            {
                for (const [key, value] of (await result.value).entries()) {
                    ctx.state.body[key] = value
                }
            }
            break
    }

    debug('request received from %s parse body: %O', result.type, ctx.state.body)

    await next()
}
