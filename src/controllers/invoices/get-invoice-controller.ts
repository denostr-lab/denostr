import { path, pathEq } from 'ramda'
import { readFileSync } from 'fs'

import { IController, Request, Response, Status } from '../../@types/controllers.ts'
import { createSettings } from '../../factories/settings-factory.ts'
import { FeeSchedule } from '../../@types/settings.ts'

let pageCache: string

export class GetInvoiceController implements IController {
    public async handleRequest(
        _: Request,
        response: Response,
    ): Promise<void> {
        const settings = createSettings()

        if (
            pathEq(['payments', 'enabled'], true, settings) &&
            pathEq(['payments', 'feeSchedules', 'admission', '0', 'enabled'], true, settings)
        ) {
            if (!pageCache) {
                const name = path(['info', 'name'])(settings) as string
                const feeSchedule = path(['payments', 'feeSchedules', 'admission', '0'], settings) as FeeSchedule
                pageCache = readFileSync('./resources/index.html', 'utf8')
                    .replaceAll('{{name}}', name)
                    .replaceAll('{{processor}}', settings.payments?.processor)
                    .replaceAll('{{amount}}', (BigInt(feeSchedule.amount) / 1000n).toString())
            }

            response.status = Status.OK
            response.headers.set('content-type', 'text/html')
            response.body = pageCache
            pageCache = ''
        } else {
            response.status = Status.NotFound
        }
    }
}
