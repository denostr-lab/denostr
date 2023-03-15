import { readFileSync } from 'node:fs'

import { path, pathEq } from 'ramda'

import { NextFunction, Response, RouterContext, Status } from '../../@types/controllers.ts'
import { FeeSchedule } from '../../@types/settings.ts'
import { createSettings } from '../../factories/settings-factory.ts'

let pageCache: string

export const getInvoiceRequestHandler = async (ctx: RouterContext, next: NextFunction) => {

  const res: Response = ctx.response
  const settings = createSettings()
  if (pathEq(['payments', 'enabled'], true, settings)
   && pathEq(['payments', 'feeSchedules', 'admission', '0', 'enabled'], true, settings)) {
    if (!pageCache) {
      const name = path<string>(['info', 'name'])(settings)
      const feeSchedule = path<FeeSchedule>(['payments', 'feeSchedules', 'admission', '0'], settings)
      pageCache = readFileSync('./resources/index.html', 'utf8')
        .replaceAll('{{name}}', name)
        .replaceAll('{{amount}}', (BigInt(feeSchedule.amount) / 1000n).toString())
    }
    res.status = Status.OK
    res.headers.set('content-type', 'text/html; charset=utf8')
    res.body = pageCache
 
  } else {
    res.status = Status.NotFound
    res.headers.set('content-type', 'text/html; charset=utf8')
    res.body = 'not Found'
  }

  await next()
}
