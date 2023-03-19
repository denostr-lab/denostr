import mongoose from 'npm:mongoose'
import {
    __,
    always,
    applySpec,
    complement,
    cond,
    equals,
    evolve,
    filter,
    forEach,
    forEachObjIndexed,
    groupBy,
    identity,
    ifElse,
    invoker,
    is,
    isEmpty,
    isNil,
    map,
    modulo,
    nth,
    omit,
    path,
    paths,
    pipe,
    prop,
    propSatisfies,
    T,
    toPairs,
} from 'ramda'

import { DatabaseClient, EventId } from '../@types/base.ts'
import { DBEvent, Event } from '../@types/event.ts'
import { IEventRepository, IQueryResult } from '../@types/repositories.ts'
import { SubscriptionFilter } from '../@types/subscription.ts'
import { ContextMetadataKey, EventDeduplicationMetadataKey, EventDelegatorMetadataKey, EventExpirationTimeMetadataKey } from '../constants/base.ts'
import { EventsModel } from '../database/models/index.ts'
import { IEvent } from '../database/types/index.ts'
import { createLogger } from '../factories/logger-factory.ts'
import { isGenericTagQuery } from '../utils/filter.ts'
import { toBuffer } from '../utils/transform.ts'

const toNumber = (input: number) => Number(input)

const toJSON = (input: any) => {
    return input
    // return JSON.stringify(input)
}

const even = pipe(modulo(__, 2), equals(0))

const groupByLengthSpec = groupBy<string, 'exact' | 'even' | 'odd'>(
    pipe(
        prop('length'),
        cond([
            [equals(64), always('exact')],
            [even, always('even')],
            [T, always('odd')],
        ]),
    ),
)

const debug = createLogger('event-repository')

export class EventRepository implements IEventRepository {
    public constructor(
        private readonly masterDbClient: mongoose.Connection,
        private readonly readReplicaDbClient: mongoose.Connection,
    ) {}

    public findByFilters(filters: SubscriptionFilter[]): mongoose.Aggregate<IEvent[]> {
        debug('querying for %o', filters)
        if (!Array.isArray(filters) || !filters.length) {
            throw new Error('Filters cannot be empty')
        }

        const pipelines: any[] = []
        filters.forEach((currentFilter: SubscriptionFilter) => {
            const $match: any = {}
            const $and: any[] = []
            const $or: any[] = []
            let $limit = 500
            const $sort = { event_created_at: 1 }

            for (const [filterName, filterValue] of Object.entries(currentFilter)) {
                const isGenericTag = isGenericTagQuery(filterName)
                if (isGenericTag) {
                    $and.push({
                        event_tags: { $elemMatch: { $eq: [filterName[1], ...filterValue] } },
                    })
                } else {
                    const fieldNames = ['event_pubkey', 'event_delegator', 'authors', 'kinds', 'limit', 'until', 'since', 'ids']
                    const fieldName: any = fieldNames.find((name) => currentFilter.hasOwnProperty(name))
                    const fieldValue = currentFilter[fieldName]

                    if (fieldName === 'kinds' && Array.isArray(fieldValue)) {
                        $match['event_kind'] = { $in: fieldValue }
                    }

                    if (fieldName === 'since' && typeof fieldValue === 'number') {
                        $match['event_created_at'] = { $gte: fieldValue }
                    }

                    if (fieldName === 'until' && typeof fieldValue === 'number') {
                        $match['event_created_at'] = { $lte: fieldValue }
                    }

                    if (fieldName === 'limit' && typeof fieldValue === 'number') {
                        $limit = fieldValue
                        $sort.event_created_at = -1
                    }
                }
            }

            const $andSubOr: any[] = []
            forEachObjIndexed(
                (tableFields: string[], filterName: string | number) => {
                    const filterValue = currentFilter[filterName]
                    if (filterValue) {
                        tableFields.forEach((field) => {
                            $andSubOr.push({ [field]: filterValue.map(toBuffer) })
                        })
                    }
                },
            )({
                authors: ['event_pubkey', 'event_delegator'],
                ids: ['event_id'],
            })

            if ($andSubOr.length > 0) {
                $and.push($andSubOr)
            }

            if ($and.length > 0) {
                $match.$and = $and
            }

            if ($or.length > 0) {
                $match.$or = $or
            }
            pipelines.push([
                { $match },
                { $sort },
                { $limit },
            ])
        })

        return this.readReplicaDbClient
            .model(EventsModel.name, EventsModel.schema)
            .aggregate([...pipelines])
    }

    public async create(event: Event): Promise<number> {
        return this.insert(event).then(prop('rowCount') as () => number, () => 0)
    }

    private async insert(event: Event) {
        debug('inserting event: %o', event)
        const row = applySpec({
            event_id: pipe(prop('id'), toBuffer),
            event_pubkey: pipe(prop('pubkey'), toBuffer),
            event_created_at: prop('created_at'),
            event_kind: prop('kind'),
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
            const result = await this.masterDbClient
                .model(EventsModel.name, EventsModel.schema)
                .collection
                .insertOne(row)
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

        const row = applySpec<DBEvent>({
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

        const query = this.masterDbClient
            .model(EventsModel.name, EventsModel.schema)
            .updateOne(
                {
                    event_pubkey: row.event_pubkey,
                    event_kind: row.event_kind,
                    event_deduplication: row.event_deduplication,
                    $or: [
                        { event_kind: { $eq: 0 } },
                        { event_kind: { $eq: 3 } },
                        { event_kind: { $eq: 41 } },
                        { event_kind: { $gte: 10000, $lt: 20000 } },
                        { event_kind: { $gte: 30000, $lt: 40000 } },
                    ],
                    event_created_at: { $lt: row.event_created_at },
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
            const result = await this.masterDbClient
                .model(EventsModel.name, EventsModel.schema)
                .insertMany(stubs, { ordered: false })
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
        const query = this.masterDbClient
            .model(EventsModel.name, EventsModel.schema)
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

        if (result.matchedCount === 0) {
            // 'No document matches the filter'
            return 0
        } else if (result.modifiedCount === 0) {
            // 'All matched documents already have the updated value'
            return 0
        }

        return result.modifiedCount
    } catch (err) {
        if (!String(err).indexOf('E11000 duplicate key error collection')) {
            console.error(String(err))
        }
        return 0
    }
}
