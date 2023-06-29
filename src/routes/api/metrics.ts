// deno-lint-ignore-file no-inferrable-types
import _ from 'underscore'
import dayjs from 'dayjs'

import { Context, Router } from '@/@types/controllers.ts'
import { readReplicaEventsModel } from '@/database/models/Events.ts'
import { createSettings } from '@/factories/settings-factory.ts'
import { SettingsStatic } from '@/utils/settings.ts'
import { Settings } from '@/@types/settings.ts'
import { DBEvent, Event } from '@/@types/event.ts'
import { toNostrEvent } from '@/utils/event.ts'
import { readReplicaInvoicesModel } from '@/database/models/Invoices.ts'
import { withController } from '@/handlers/request-handlers/with-controller-request-handler.ts'
import { createMetricsAmountController, createMetricsEventsController, createMetricsEventsMonthlyController, createMetricsEventsYearlyController } from '@/factories/controllers/api-controller-factory.ts'

const router = new Router()

router.get('/events', withController(createMetricsEventsController))

router.get('/order/amount', withController(createMetricsAmountController))

router.get('/events/monthly', withController(createMetricsEventsMonthlyController))

router.get('/events/yearly', withController(createMetricsEventsYearlyController))
router.get('/settings', (ctx: Context) => {
    ctx.response.type = 'json'
    ctx.response.body = createSettings()
})
    .post('/settings', async (ctx: Context) => {
        const response = ctx.response
        const req = ctx.request

        const parseBody = req.body({ type: 'json' })
        const body = await parseBody.value
        const basePath = SettingsStatic.getSettingsFileBasePath()
        SettingsStatic.saveSettings(basePath, body as Settings)

        response.type = 'json'
        response.body = {
            ok: 1,
        }
    })

export default router
