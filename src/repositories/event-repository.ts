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
        private readonly masterDbClient: DatabaseClient,
        private readonly readReplicaDbClient: DatabaseClient,
    ) {}

    public findByFilters(filters: SubscriptionFilter[]): mongoose.Aggregate<IEvent[]> {
        debug('querying for %o', filters)
        if (!Array.isArray(filters) || !filters.length) {
            throw new Error('Filters cannot be empty')
        }
        const pipelines = filters.map((currentFilter) => {
            const $match: any = {}
            const $and: any[] = []

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
                    // $match[fieldName] = { $in: fieldValue }

                    if (fieldName === 'kinds' && Array.isArray(fieldValue)) {
                        $match['event_kind'] = { $in: fieldValue }
                        // builder.whereIn('event_kind', currentFilter.kinds)
                    }
        
                    if (fieldName === 'since' && typeof fieldValue === 'number') {
                        $match['event_created_at'] = { $gte: fieldValue }
                    }

                    if (fieldName === 'until' && typeof fieldValue === 'number') {
                        $match['event_created_at'] = { $lte: fieldValue }
                    }

                    if (fieldName === 'limit' && typeof fieldValue === 'number') {
                        // $match['event_created_at'] = { $lte: fieldValue }
                    } else {
                        //
                    }

                    // if (typeof currentFilter.limit === 'number') {
                    //     // builder.limit(currentFilter.limit).orderBy('event_created_at', 'DESC')
                    // } else {
                    //     // builder.limit(500).orderBy('event_created_at', 'asc')
                    // }
                }
            }

            if ($and.length > 0) {
                $match.$and = $and
            }

            return {
                $match,
            }
        })

        const cursor = EventsModel.aggregate([...pipelines])

        return cursor

        // debug('querying for %o', filters)
        // if (!Array.isArray(filters) || !filters.length) {
        //     throw new Error('Filters cannot be empty')
        // }
        // const queries = filters.map((currentFilter) => {
        //     const builder = this.readReplicaDbClient<DBEvent>('events')

        //     forEachObjIndexed(
        //         (tableFields: string[], filterName: string | number) => {
        //             builder.andWhere((bd) => {
        //                 cond([
        //                     [isEmpty, () => void bd.whereRaw('1 = 0')],
        //                     [
        //                         complement(isNil),
        //                         pipe(
        //                             groupByLengthSpec,
        //                             evolve({
        //                                 exact: (pubkeys: string[]) => tableFields.forEach((tableField) => bd.orWhereIn(tableField, pubkeys.map(toBuffer))),
        //                                 even: forEach((prefix: string) =>
        //                                     tableFields.forEach((tableField) =>
        //                                         bd.orWhereRaw(
        //                                             `substring("${tableField}" from 1 for ?) = ?`,
        //                                             [prefix.length >> 1, toBuffer(prefix)],
        //                                         )
        //                                     )
        //                                 ),
        //                                 odd: forEach((prefix: string) =>
        //                                     tableFields.forEach((tableField) =>
        //                                         bd.orWhereRaw(
        //                                             `substring("${tableField}" from 1 for ?) BETWEEN ? AND ?`,
        //                                             [
        //                                                 (prefix.length >> 1) + 1,
        //                                                 `\\x${prefix}0`,
        //                                                 `\\x${prefix}f`,
        //                                             ],
        //                                         )
        //                                     )
        //                                 ),
        //                             } as any),
        //                         ),
        //                     ],
        //                 ])(currentFilter[filterName] as string[])
        //             })
        //         },
        //     )({
        //         authors: ['event_pubkey', 'event_delegator'],
        //         ids: ['event_id'],
        //     })

        //     if (Array.isArray(currentFilter.kinds)) {
        //         builder.whereIn('event_kind', currentFilter.kinds)
        //     }

        //     if (typeof currentFilter.since === 'number') {
        //         builder.where('event_created_at', '>=', currentFilter.since)
        //     }

        //     if (typeof currentFilter.until === 'number') {
        //         builder.where('event_created_at', '<=', currentFilter.until)
        //     }

        //     if (typeof currentFilter.limit === 'number') {
        //         builder.limit(currentFilter.limit).orderBy('event_created_at', 'DESC')
        //     } else {
        //         builder.limit(500).orderBy('event_created_at', 'asc')
        //     }

        //     const andWhereRaw = invoker(1, 'andWhereRaw')
        //     const orWhereRaw = invoker(2, 'orWhereRaw')

        //     pipe(
        //         toPairs,
        //         filter(pipe(nth(0) as () => string, isGenericTagQuery)) as any,
        //         forEach(([filterName, criteria]: [string, string[]]) => {
        //             builder.andWhere((bd) => {
        //                 ifElse(
        //                     isEmpty,
        //                     () => andWhereRaw('1 = 0', bd),
        //                     forEach((criterion: string) =>
        //                         void orWhereRaw(
        //                             '"event_tags" @> ?',
        //                             [
        //                                 JSON.stringify([[filterName[1], criterion]]) as any,
        //                             ],
        //                             bd,
        //                         )
        //                     ),
        //                 )(criteria)
        //             })
        //         }),
        //     )(currentFilter as any)

        //     return builder
        // })

        // const [query, ...subqueries] = queries
        // if (subqueries.length) {
        //     query.union(subqueries, true)
        // }

        // return query
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
            const result = await EventsModel.collection.insertOne(row)
            return { rowCount: result.insertedId ? 1 : 0 }
        } catch (err) {
            console.error(err)
            return { rowCount: 0 }
        }

        // return this.masterDbClient('events')
        //     .insert(row)
        //     .onConflict()
        //     .ignore()
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

        const query = EventsModel.updateOne(
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
        return tryCatchUpdate(query)

        // const query = this.masterDbClient('events')
        //     .insert(row)
        //     // NIP-16: Replaceable Events
        //     // NIP-33: Parameterized Replaceable Events
        //     .onConflict(
        //         this.masterDbClient.raw(
        //             '(event_pubkey, event_kind, event_deduplication) WHERE (event_kind = 0 OR event_kind = 3 OR event_kind = 41 OR (event_kind >= 10000 AND event_kind < 20000)) OR (event_kind >= 30000 AND event_kind < 40000)',
        //         ),
        //     )
        //     .merge(omit(['event_pubkey', 'event_kind', 'event_deduplication'])(row))
        //     .where('events.event_created_at', '<', row.event_created_at)

        // return {
        //     then: <T1, T2>(
        //         onfulfilled: (value: number) => T1 | PromiseLike<T1>,
        //         onrejected: (reason: any) => T2 | PromiseLike<T2>,
        //     ) => query.then(prop('rowCount') as () => number).then(
        //         onfulfilled,
        //         onrejected,
        //     ),
        //     catch: <T>(onrejected: (reason: any) => T | PromiseLike<T>) => query.catch(onrejected),
        //     toString: (): string => query.toString(),
        // } as Promise<number>
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
            const result = await EventsModel.insertMany(stubs, { ordered: false })
            return result.length
        } catch (err) {
            console.error(err)
            return 0
        }
    }

    public async deleteByPubkeyAndIds(
        pubkey: string,
        eventIdsToDelete: EventId[],
    ): Promise<number> {
        debug('deleting events from %s: %o', pubkey, eventIdsToDelete)
        const query = EventsModel.updateMany(
            {
                event_pubkey: toBuffer(pubkey),
                event_id: { $in: eventIdsToDelete.map(toBuffer) },
                deleted_at: null,
            },
            { deleted_at: new Date() },
        )
        return tryCatchUpdate(query)
    }
}

async function tryCatchUpdate(query: any) {
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
        console.error(err)
        return 0
    }
}
