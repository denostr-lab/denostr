import mongoose from 'npm:mongoose'
import { __, always, applySpec, forEachObjIndexed, identity, ifElse, is, isNil, path, paths, pipe, prop, propSatisfies } from 'ramda'

import { EventId } from '../@types/base.ts'
import { Event } from '../@types/event.ts'
import { IEventRepository } from '../@types/repositories.ts'
import { SubscriptionFilter } from '../@types/subscription.ts'
import { ContextMetadataKey, EventDeduplicationMetadataKey, EventDelegatorMetadataKey, EventExpirationTimeMetadataKey, EventTags } from '../constants/base.ts'
import { masterEventsModel, readReplicaEventsModel } from '../database/models/Events.ts'
import { IEvent } from '../database/types/index.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { isGenericTagQuery } from '../utils/filter.ts'
import { toBuffer } from '../utils/transform.ts'
import { isChannelMetadata } from '../utils/event.ts'

const toNumber = (input: number) => Number(input)

const toJSON = (input: any) => {
    return input
    // return JSON.stringify(input)
}

const debug = createLogger('event-repository')

export class EventRepository implements IEventRepository {
    public findByFilters(filters: SubscriptionFilter[]): mongoose.Aggregate<IEvent[]> {
        debug('querying for %o', filters)
        if (!Array.isArray(filters) || !filters.length) {
            throw new Error('Filters cannot be empty')
        }

        const $match: any = {}
        const $or: any[] = []
        const $sort = { event_created_at: 1 }
        const limit = {
            $limit: 500,
        }
        const pipelines: any[] = [
            {
                $match,
            },
            {
                $sort,
            },
            limit,
        ]

        filters.forEach((currentFilter: SubscriptionFilter) => {
            const subFilter: any = {}
            const subFilterOr: any = []
            for (const [filterName, filterValue] of Object.entries(currentFilter)) {
                const isGenericTag = isGenericTagQuery(filterName)
                if (isGenericTag) {
                    if (Array.isArray(filterValue) && filterValue.length > 0) {
                        subFilterOr.push({ event_tags: { $size: 0 } })
                        subFilterOr.push({
                            event_tags: {
                                $elemMatch: {
                                    $elemMatch: {
                                        $in: [filterName[1], ...filterValue],
                                    },
                                },
                            },
                        })
                    }
                } else {
                    const fieldNames = ['kinds', 'limit', 'until', 'since']
                    if (fieldNames.includes(filterName)) {
                        if (filterName === 'kinds' && Array.isArray(filterValue)) {
                            subFilter['event_kind'] = { $in: filterValue }
                        }

                        if (filterName === 'since' && typeof filterValue === 'number') {
                            subFilter['event_created_at'] = { $gte: filterValue }
                        }

                        if (filterName === 'until' && typeof filterValue === 'number') {
                            subFilter['event_created_at'] = { $lte: filterValue }
                        }

                        if (filterName === 'limit' && typeof filterValue === 'number') {
                            limit.$limit = filterValue
                            $sort.event_created_at = -1
                        }
                    }
                }
            }

            forEachObjIndexed(
                (tableFields: string[], fieldName: any) => {
                    const filterValue = currentFilter[fieldName]
                    if (filterValue) {
                        tableFields.forEach((field: any) => {
                            subFilterOr.push({ [field]: { $in: filterValue.map(toBuffer) } })
                        })
                    }
                },
            )({
                authors: ['event_pubkey', 'event_delegator'],
                ids: ['event_id'],
            })

            if (subFilterOr.length > 0) {
                subFilter['$or'] = subFilterOr
            }

            if (Object.keys(subFilter).length > 0) {
                $or.push(subFilter)
            }
        })

        if ($or.length > 0) {
            $match.$or = $or
        }

        return readReplicaEventsModel.aggregate(pipelines)
    }

    public async create(event: Event): Promise<number> {
        return this.insert(event).then(prop('rowCount') as () => number, () => 0)
    }

    private async insert(event: Event) {
        debug('inserting event: %o', event)
        const row = applySpec({
            event_id: pipe(prop('id'), toBuffer),
            event_pubkey: pipe(prop('pubkey'), toBuffer),
            event_created_at: pipe(prop('created_at'), toNumber),
            event_kind: pipe(prop('kind'), toNumber),
            event_tags: pipe(prop('tags'), toJSON),
            event_content: prop('content'),
            event_signature: pipe(prop('sig'), toBuffer),
            event_delegator: ifElse(
                propSatisfies(is(String), EventDelegatorMetadataKey),
                pipe(prop(EventDelegatorMetadataKey as any), toBuffer),
                always(null),
            ),
            remote_address: path([
                ContextMetadataKey as any,
                'remoteAddress',
                'address',
            ]),
            expires_at: ifElse(
                propSatisfies(is(Number), EventExpirationTimeMetadataKey),
                prop(EventExpirationTimeMetadataKey as any),
                always(null),
            ),
        })(event)

        try {
            const result = await masterEventsModel.collection.insertOne(row)
            return { rowCount: result.insertedId ? 1 : 0 }
        } catch (err) {
            if (!String(err).indexOf('E11000 duplicate key error collection')) {
                console.error(String(err))
            }
            return { rowCount: 0 }
        }
    }

    public async upsert(event: Event): Promise<number> {
        debug('upserting event: %o', event)

        const row: IEvent = applySpec({
            event_id: pipe(prop('id'), toBuffer),
            event_pubkey: pipe(prop('pubkey'), toBuffer),
            event_created_at: prop('created_at'),
            event_kind: pipe(prop('kind'), toNumber),
            event_tags: pipe(prop('tags'), toJSON),
            event_content: prop('content'),
            event_signature: pipe(prop('sig'), toBuffer),
            event_delegator: ifElse(
                propSatisfies(is(String), EventDelegatorMetadataKey),
                pipe(prop(EventDelegatorMetadataKey as any), toBuffer),
                always(null),
            ),
            event_deduplication: ifElse(
                propSatisfies(isNil, EventDeduplicationMetadataKey),
                pipe(paths([['pubkey'], ['kind']]), toJSON),
                pipe(prop(EventDeduplicationMetadataKey as any), toJSON),
            ),
            remote_address: path([
                ContextMetadataKey as any,
                'remoteAddress',
                'address',
            ]),
            expires_at: ifElse(
                propSatisfies(is(Number), EventExpirationTimeMetadataKey),
                prop(EventExpirationTimeMetadataKey as any),
                always(null),
            ),
        })(event)

        const extraFilter: any = {}
        if (isChannelMetadata(row.event_kind) && Array.isArray(row.event_tags) && row.event_tags.length > 0) {
            if (Array.isArray(row.event_tags[0]) && row.event_tags[0].length >= 2) {
                const [, parentId] = row.event_tags[0]
                extraFilter['event_tags.0.0'] = EventTags.Event
                extraFilter['event_tags.0.1'] = parentId
            }
        }

        const query = masterEventsModel
            .updateOne(
                {
                    event_pubkey: row.event_pubkey,
                    event_kind: row.event_kind,
                    event_deduplication: row.event_deduplication,
                    $or: [
                        { event_kind: { $eq: 0 } },
                        { event_kind: { $eq: 3 } },
                        { event_kind: { $eq: 41 } },
                        { event_kind: { $eq: 141 } },
                        { event_kind: { $gte: 10000, $lt: 20000 } },
                        { event_kind: { $gte: 30000, $lt: 40000 } },
                    ],
                    event_created_at: { $lt: row.event_created_at },
                    ...extraFilter,
                },
                {
                    $set: row,
                },
                { upsert: true },
            )
        return ignoreUpdateConflicts(query)
    }

    public async insertStubs(
        pubkey: string,
        eventIdsToDelete: EventId[],
    ): Promise<number> {
        debug('inserting stubs for %s: %o', pubkey, eventIdsToDelete)
        const date = new Date()
        const stubs = eventIdsToDelete.map(
            applySpec({
                event_id: pipe(identity, toBuffer),
                event_pubkey: pipe(always(pubkey), toBuffer),
                event_created_at: always(Math.floor(date.getTime() / 1000)),
                event_kind: always(5),
                event_tags: always([]),
                event_content: always(''),
                event_signature: pipe(always(''), toBuffer),
                event_delegator: always(null),
                event_deduplication: pipe(always([pubkey, 5]), toJSON),
                expires_at: always(null),
                deleted_at: always(date.toISOString()),
            }),
        )

        try {
            const result = await masterEventsModel.insertMany(stubs, { ordered: false })
            return result.length
        } catch (err) {
            if (!String(err).indexOf('E11000 duplicate key error collection')) {
                console.error(String(err))
            }
            return 0
        }
    }

    public async deleteByPubkeyAndIds(
        pubkey: string,
        eventIdsToDelete: EventId[],
    ): Promise<number> {
        debug('deleting events from %s: %o', pubkey, eventIdsToDelete)
        const query = masterEventsModel
            .updateMany(
                {
                    event_pubkey: toBuffer(pubkey),
                    event_id: { $in: eventIdsToDelete.map(toBuffer) },
                    deleted_at: null,
                },
                { deleted_at: new Date() },
            )
        return ignoreUpdateConflicts(query)
    }
}
async function ignoreUpdateConflicts(query: any) {
    try {
        const result = await query
        debug('ignoreUpdateConflicts result: %o', result)
        return result.upsertedCount || result.modifiedCount || 0
    } catch (err) {
        debug('ignoreUpdateConflicts error: %o', err)
        if (!String(err).indexOf('E11000 duplicate key error collection')) {
            console.error(String(err))
        }
        return 0
    }
}
