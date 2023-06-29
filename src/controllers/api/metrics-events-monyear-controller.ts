import { helpers, IController, Request, Response, RouterContext } from '@/@types/controllers.ts'
import _ from 'underscore'
import dayjs from 'dayjs'
import { DBEvent } from '@/@types/event.ts'
import { readReplicaEventsModel } from '@/database/models/Events.ts'
import { toNostrEvent } from '@/utils/event.ts'

export class MetricsEventsMonthlyController implements IController {
    public constructor(
        private readonly readReplicaEventsModel: mongoose.EventsModel<DBInvoice, {}, {}>,
    ) {}
    public async handleRequest(req: Request, response: Response, ctx: RouterContext) {
        const unixTime = Date.now() / 1000
        const now = new Date()
        now.setMonth(-1)
        const unixTimeBeforeMonth = now.valueOf() / 1000
        const theMonLastDay = dayjs(now).endOf('month').get('D')

        const query = {
            event_created_at: {
                $lte: Math.floor(unixTime),
                $gte: Math.floor(unixTimeBeforeMonth),
            },
        }

        const dbEvents: DBEvent[] = await this.readReplicaEventsModel.find(query)
        const events = dbEvents
            .map((event) => toNostrEvent(event))
            .filter((event) => event.created_at < unixTime && event.created_at > unixTimeBeforeMonth)

        const currentTimestamp = Math.floor(unixTime)

        // events.push({ ...events[0], created_at:  Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 3 })
        for (let i = 0; i < theMonLastDay; i++) {
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
    }
}

export class MetricsEventsYearlyController implements IController {
    public constructor(
        private readonly readReplicaEventsModel: mongoose.EventsModel<DBInvoice, {}, {}>,
    ) {}
    public async handleRequest(req: Request, response: Response, ctx: RouterContext) {
        const unixTime = Date.now() / 1000
        const now = new Date()
        now.setFullYear(-1)

        const unixTimeMinux1yr = now.valueOf() / 1000

        const query = {
            event_created_at: {
                $lte: Math.floor(unixTime),
                $gte: Math.floor(unixTimeMinux1yr),
            },
        }

        const dbEvents: DBEvent[] = await this.readReplicaEventsModel.find(query)
        const events = dbEvents
            .map((event) => toNostrEvent(event))
            .filter((event) => event.created_at < unixTime && event.created_at > unixTimeMinux1yr)

        for (let i = 0; i < 12; i++) {
            const now = dayjs().month(i)
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
    }
}
