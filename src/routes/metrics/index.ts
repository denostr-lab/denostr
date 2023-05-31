import { Router, Context } from '@/@types/controllers.ts'
import { readReplicaEventsModel } from '@/database/models/Events.ts'
import { createSettings } from '@/factories/settings-factory.ts'
import { SettingsStatic } from '@/utils/settings.ts'
import { Settings } from '@/@types/settings.ts'

const router = new Router()

router.get('/events', async (ctx: Context) => {
    const response = ctx.response
    const req = ctx.request

    const [{ count: uniquePubkeys }] = await readReplicaEventsModel.aggregate([
        { $project: { 'event_pubkey': 1 } },
        { $group: { '_id': '$event_pubkey' } },
        { $group: { '_id': null, 'count': { '$sum': 1 } } },
    ])

    const eventCount = await readReplicaEventsModel.countDocuments({})

    response.type = 'json'
    response.body = {
        status: 'ok',
        uniquePubkeys,
        eventCount,
    }
})

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
