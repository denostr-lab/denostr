import _ from 'underscore'
import { helpers, IController, Request, Response, RouterContext } from '@/@types/controllers.ts'

import { DBEvent } from '@/@types/event.ts'
import { readReplicaEventsModel } from '@/database/models/Events.ts'
import { toNostrEvent } from '@/utils/event.ts'

export class MetricsEventsController implements IController {
    public constructor(
        private readonly readReplicaEventsModel: mongoose.EventsModel<DBInvoice, {}, {}>,
    ) {}
    public async handleRequest(req: Request, response: Response, ctx: RouterContext) {
        const unixTimeNow = Math.floor(Date.now() / 1000)
        const query = {
            event_created_at: {
                $lte: unixTimeNow,
            },
        }

        const dbEvents: DBEvent[] = await readReplicaEventsModel.find(query)
        const events = dbEvents
            .map((event) => toNostrEvent(event))
            .filter((event) => event.created_at < unixTimeNow && event.content !== '')

        const uniqueEvents: Event[] = _.uniq(events, (event) => event.id)
        const events24Hours: Event[] = events.filter((e) => e.created_at > (unixTimeNow - 60 * 60 * 24))
        const latestEvents: Event[] = _.sortBy(uniqueEvents, 'created_at').reverse().slice(0, 30) // 30 is longListAmount
        const kindsList: { [kind: string]: number } = _.countBy(events, 'kind')
        const uniquePubkeys: Event[] = _.uniq(events, (event) => event.pubkey)
        const uniquePubkeys24Hours: Event[] = uniquePubkeys.filter((e) => e.created_at > (unixTimeNow - 60 * 60 * 24))

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
            eventCount24Hours: events24Hours.length,
            events: latestEvents,
            // where: whereArray,
        }
    }
}
