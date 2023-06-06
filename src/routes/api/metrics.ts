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
import {readReplicaInvoicesModel} from '@/database/models/Invoices.ts'

const router = new Router()

router.get('/events', async (ctx: Context) => {
    const response = ctx.response
    // const req = ctx.request

    const unixTimeNow = Math.floor(Date.now() / 1000)
    const query = {
        event_created_at: {
            $lt: unixTimeNow,
        },
    }

    const dbEvents: DBEvent[] = await readReplicaEventsModel.find(query)
    const events = dbEvents
        .map((event) => toNostrEvent(event))
        .filter((event) => event.created_at < unixTimeNow && event.content !== '')

    const uniqueEvents: Event[] = _.uniq(events, (event) => event.id)
    const Events24Hours: Event[] = events.filter(e => e.created_at > (unixTimeNow - 60*60*24))
    const latestEvents: Event[] = _.sortBy(uniqueEvents, 'created_at').reverse().slice(0, 30) // 30 is longListAmount
    const kindsList: { [kind: string]: number } = _.countBy(events, 'kind')
    const uniquePubkeys: Event[] = _.uniq(events, (event) => event.pubkey)
    const uniquePubkeys24Hours :Event[] = uniquePubkeys.filter(e => e.created_at > (unixTimeNow - 60*60*24))

    const eventsUTC: number[] = events.map((event) => {
        const eventDate = new Date(event.created_at * 1000)
        return eventDate.getUTCHours()
    })

    // key: utc, value: the count of event in that time
    const UTCList: { [utc: string]: number } = _.countBy(eventsUTC)

    response.type = 'json'
    response.body = {
        status: 'ok',

        utc: UTCList,
        uniquePubkeys: uniquePubkeys.length,
        uniquePubkeys24Hours: uniquePubkeys24Hours.length,
        kinds: kindsList,
        // relays: relayCount,
        eventCount: events.length,
        eventCount24Hours: Events24Hours.length,
        events: latestEvents,
        // where: whereArray,
    }
})

router.get('/order/amount',async (ctx:Context) => {
    const response = ctx.response
    const pipline = [
        {
			$match:{status:"completed"}
		},
        {
            $group: {
                _id: "$unit",
                total: {
                    $sum: "$amount_paid"
                }
            }
        }
    ]

    type AmountRow = {
        _id: string;
        total: number;
    }
    const amountArr: AmountRow[] = await readReplicaInvoicesModel.aggregate(pipline)

    const amount:number = 0
    for(let i = 0; i<amountArr.length; i++){
        if(amountArr[i]._id == "msats") {
            amount += amountArr[i].total / 1000
        }
        if(amountArr[i]._id == "sats") {
            amount += amountArr[i].total 
        }
    }
    
    response.type = 'json'
    response.body = {
        status: 'ok',
        total: amount,
    }
})

router.get('/events/monthly', async (ctx: Context) => {
    const response = ctx.response
    // const req = ctx.request

    const unixTime = Date.now() / 1000
    const now = new Date()
    now.setMonth(-1)
    const unixTimeBeforeMonth = now.valueOf() / 1000

    const query = {
        event_created_at: {
            $lt: Math.floor(unixTime),
            $gt: Math.floor(unixTimeBeforeMonth),
        },
    }

    const dbEvents: DBEvent[] = await readReplicaEventsModel.find(query)
    const events = dbEvents
        .map((event) => toNostrEvent(event))
        .filter((event) => event.created_at < unixTime && event.created_at > unixTimeBeforeMonth)

    const currentTimestamp = Math.floor(unixTime)

    // events.push({ ...events[0], created_at:  Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 3 })
    for (let i = 0; i < 30; i++) {
        const fromTimestamp = Math.floor(currentTimestamp - 60 * 60 * 24 * (i + 1))
        const toTimestamp = Math.floor(currentTimestamp - 60 * 60 * 24 * i)

        // if timestamp is in a range of a particular day,
        // squash it to the timestamp at the start of the day
        for (let j = 0; j < events.length; j++) {
            if (events[j].created_at > fromTimestamp && events[j].created_at < toTimestamp) {
                events[j].created_at = fromTimestamp
            }
        }
    }

    const monthlyData = _.countBy(events, 'created_at')

    response.type = 'json'
    response.body = {
        status: 'ok',
        body: monthlyData,
    }
})

router.get('/events/yearly', async (ctx: Context) => {
    const response = ctx.response
    // const req = ctx.request

    const unixTime = Date.now() / 1000
    const now = new Date()
    now.setFullYear(-1)

    const unixTimeMinux1yr = now.valueOf() / 1000

    const query = {
        event_created_at: {
            $lt: Math.floor(unixTime),
            $gt: Math.floor(unixTimeMinux1yr),
        },
    }

    const dbEvents: DBEvent[] = await readReplicaEventsModel.find(query)
    const events = dbEvents
        .map((event) => toNostrEvent(event))
        .filter((event) => event.created_at < unixTime && event.created_at > unixTimeMinux1yr)

    for (let i = 0; i < 12; i++) {
        const now = dayjs.month(i)
        const currentTimestamp = Math.floor(now.valueOf() / 1000)
        const fromTimestamp = Math.floor(currentTimestamp - 60 * 60 * 24 * now.daysInMonth() * (i + 1))
        const toTimestamp = Math.floor(currentTimestamp - 60 * 60 * 24 * now.daysInMonth() * i)

        // if timestamp is in a range of a particular day,
        // squash it to the timestamp at the start of the day
        for (let j = 0; j < events.length; j++) {
            if (events[j].created_at > fromTimestamp && events[j].created_at < toTimestamp) {
                events[j].created_at = fromTimestamp
            }
        }
    }

    const yearlyData = _.countBy(events, 'created_at')
    response.type = 'json'
    response.body = {
        status: 'ok',
        body: yearlyData,
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
