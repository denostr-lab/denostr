import { helpers, IController, Request, Response, RouterContext } from '@/@types/controllers.ts'
import { readReplicaEventsModel } from '@/database/models/Events.ts'
import { Sort } from '@/constants/base.ts'
import { toNostrEvent } from '@/utils/event.ts'

export class EventsController implements IController {
    public async handleRequest(_: Request, response: Response, ctx: RouterContext) {
        const query = helpers.getQuery(ctx)
        const { sortField = 'event_created_at', sortValue = 'desc' } = query

        const limit = query?.limit ? parseInt(query.limit) : 10
        const page = query?.page ? parseInt(query.page) : 1
        const sort = { [sortField]: Sort.DESC }
        if (['asc', 'desc'].includes(sortValue)) {
            if (sortValue === 'asc') {
                sort[sortField] = Sort.ASC
            }
        }

        response.body = await readReplicaEventsModel.paginate({ event_kind: 1  }, { sort, limit, page })
            .then((result) => ({
                ...result,
                docs: result.docs.map(toNostrEvent),
            }))
    }
}
