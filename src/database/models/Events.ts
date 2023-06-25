import mongoose, { FilterQuery } from 'mongoose'
import paginate from 'mongoose-paginate'
import aggregatePaginate from 'mongoose-aggregate-paginate'

import { getMasterDbClient, getReadReplicaDbClient } from '@/database/client.ts'
import { Buffer } from 'Buffer'
import { DBEvent } from '@/@types/event.ts'
import { SubscriptionFilter } from '@/@types/subscription.ts'
import { isGenericTagQuery } from '@/utils/filter.ts'
import { Sort } from '@/constants/base.ts'
import { toBuffer } from '@/utils/transform.ts'

const eventSchema = new mongoose.Schema({
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
    first_seen: {
        type: Date,
        default: new Date(),
    },
    deleted_at: { type: String },
    expires_at: { type: Number },
})

eventSchema.index({ 'event_id': 1 }, {
    background: true,
    unique: true,
})
eventSchema.index({ 'event_pubkey': 1 }, {
    background: true,
})
eventSchema.index({ 'event_kind': 1 }, {
    background: true,
})
eventSchema.index({ 'event_signature': 1 }, {
    background: true,
})
eventSchema.index({ 'event_created_at': 1 }, {
    background: true,
})
eventSchema.index({ 'event_tags.0.0': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.0.1': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.0.2': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.0.3': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.1.0': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.1.1': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.1.2': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.1.3': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.2.0': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.2.1': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.2.2': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'event_tags.2.3': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'remote_address': 1 }, {
    background: true,
})
eventSchema.index({ 'expires_at': 1 }, {
    background: true,
    sparse: true,
})
eventSchema.index({ 'deleted_at': 1 }, {
    background: true,
    sparse: true,
})

eventSchema.plugin(paginate)
eventSchema.plugin(aggregatePaginate)

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

eventSchema.static('findBySubscriptionFilter', function (filters: SubscriptionFilter[], maxLimit: number) {
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

    return this.find(query).limit(limit).sort({ event_created_at: sort })
})

eventSchema.static('countBySubscriptionFilter', function (filters: SubscriptionFilter[]) {
    const query = buildMongoFilter(filters)
    return this.countDocuments(query)
})

export const modelName = 'Events'
export const collectionName = 'events'

export const EventsModel = (dbClient: mongoose.Connection) =>
    dbClient.model<DBEvent, mongoose.PaginateModel<DBEvent>>(
        modelName,
        eventSchema,
        collectionName,
    )

export const masterEventsModel = EventsModel(getMasterDbClient())
export const readReplicaEventsModel = EventsModel(getReadReplicaDbClient())
