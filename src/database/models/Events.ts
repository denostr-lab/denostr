import mongoose, { FilterQuery } from 'mongoose'

import { getMasterDbClient, getReadReplicaDbClient } from '../client.ts'
import { Buffer } from 'Buffer'
import { DBEvent } from '../../@types/event.ts'
import { SubscriptionFilter } from '../../@types/subscription.ts'
import { isGenericTagQuery } from '../../utils/filter.ts'
import { Sort } from '../../constants/base.ts'
import { toBuffer } from '../../utils/transform.ts'

const EventSchema = new mongoose.Schema({
    event_id: {
        type: Buffer,
        require: true,
    },
    event_pubkey: {
        type: Buffer,
        require: true,
    },
    event_kind: {
        type: Number,
        require: true,
    },
    event_created_at: {
        type: Number,
        require: true,
    },
    event_content: {
        type: String,
        require: true,
    },
    event_tags: {
        type: [[String]],
        require: true,
    },
    event_signature: {
        type: Buffer,
        require: true,
    },
    event_delegator: {
        type: Buffer,
    },
    event_deduplication: [mongoose.Schema.Types.Mixed],
    first_seen: { type: Date },
    deleted_at: { type: Date },
    expires_at: { type: Number },
})

EventSchema.index({ 'event_id': 1 }, {
    background: true,
    unique: true,
})
EventSchema.index({ 'event_pubkey': 1 }, {
    background: true,
})
EventSchema.index({ 'event_kind': 1 }, {
    background: true,
})
EventSchema.index({ 'event_signature': 1 }, {
    background: true,
})
EventSchema.index({ 'event_created_at': 1 }, {
    background: true,
})
EventSchema.index({ 'event_tags.0.0': 1 }, {
    background: true,
    sparse: true,
})
EventSchema.index({ 'event_tags.0.1': 1 }, {
    background: true,
    sparse: true,
})
EventSchema.index({ 'event_tags.1.0': 1 }, {
    background: true,
    sparse: true,
})
EventSchema.index({ 'event_tags.1.1': 1 }, {
    background: true,
    sparse: true,
})
EventSchema.index({ 'remote_address': 1 }, {
    background: true,
})
EventSchema.index({ 'expires_at': 1 }, {
    background: true,
    sparse: true,
})
EventSchema.index({ 'deleted_at': 1 }, {
    background: true,
    sparse: true,
})

export const buildMongoFilter = (
    filters: SubscriptionFilter[],
) => {
    const now = Math.floor(Date.now() / 1000)
    const filterQueries = filters.map(
        (filter) => {
            const filterQuery: FilterQuery<DBEvent> = {}

            if (filter?.ids?.length) {
                filterQuery.event_id = {
                    $in: filter.ids.map(toBuffer),
                }
            }

            if (filter?.authors?.length) {
                const authors = filter.authors.map(toBuffer)
                filterQuery.$or = [
                    { event_pubkey: { $in: authors } },
                    { event_delegator: { $in: authors } },
                ]
            }

            if (filter?.kinds?.length) {
                filterQuery.event_kind = { $in: filter.kinds }
            }

            if (filter?.since) {
                filterQuery.event_created_at = { $gte: filter.since }
            }

            if (filter?.until) {
                if (!filterQuery.event_created_at) {
                    filterQuery.event_created_at = {}
                }
                filterQuery.event_created_at.$lte = filter.until
            }

            const tagFilters = Object.entries(filter)
                .filter(([filterName]) => isGenericTagQuery(filterName))
                .map(([tagName, tagValues]) => ({
                    event_tags: {
                        $elemMatch: {
                            '0': tagName.slice(1),
                            '1': { $in: Array.isArray(tagValues) ? [...tagValues] : [] },
                        },
                    },
                }))
            if (tagFilters.length > 0) {
                filterQuery.$and = tagFilters
            }

            if (!filterQuery.$and) {
                filterQuery.$and = []
            }

            // deletion events
            const deletionQueries = {
                deleted_at: {
                    $eq: null,
                },
            }

            filterQuery.$and.push({
                $or: [
                    {
                        expires_at: {
                            $exists: true,
                            $gte: now,
                        },
                        ...deletionQueries,
                    },
                    {
                        expires_at: {
                            $eq: null,
                            $exists: true,
                        },
                        ...deletionQueries,
                    },
                ],
            })

            return filterQuery
        },
    )

    return filterQueries.length === 1 ? filterQueries[0] : {
        $or: filterQueries,
    }
}

EventSchema.static('findBySubscriptionFilter', function (filters: SubscriptionFilter[], maxLimit: number) {
    const query = buildMongoFilter(filters)
    const defaultLimit = 500
    let sort = Sort.ASC
    let limit = Math.max(...filters.map((filter) => {
        if (typeof filter.limit !== 'undefined') {
            sort = Sort.DESC
        }
        return filter.limit ?? defaultLimit
    }))
    if (limit > maxLimit) {
        limit = maxLimit
    }

    return this.find(query).limit(limit).sort({ created_at: sort })
})

EventSchema.static('countBySubscriptionFilter', function (filters: SubscriptionFilter[]) {
    const query = buildMongoFilter(filters)
    return this.countDocuments(query)
})

export const EventsModelName = 'Events'
export const EventsCollectionName = 'events'

export const EventsModel = (dbClient: mongoose.Connection) =>
    dbClient.model<DBEvent>(
        EventsModelName,
        EventSchema,
        EventsCollectionName,
    )

export const masterEventsModel = EventsModel(getMasterDbClient())
export const readReplicaEventsModel = EventsModel(getReadReplicaDbClient())
