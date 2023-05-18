// deno-lint-ignore-file no-explicit-any
import type { ChangeStreamDeleteDocument, ChangeStreamInsertDocument, ChangeStreamUpdateDocument } from 'mongodb'

import type { RealTimeData } from './DatabaseWatcher.ts'

export interface IRecord {
    _id: string
    created_at: Date
    updated_at: Date
}

export function convertChangeStreamPayload(
    event:
        | ChangeStreamInsertDocument<IRecord>
        | ChangeStreamUpdateDocument<IRecord>
        | ChangeStreamDeleteDocument<IRecord>,
): RealTimeData<IRecord> | void {
    switch (event.operationType) {
        case 'insert':
            return {
                action: 'insert',
                clientAction: 'inserted',
                id: event.documentKey._id,
                data: event.fullDocument,
            }
        case 'update': {
            const diff: Record<string, any> = {
                ...event.updateDescription.updatedFields,
                ...(event.updateDescription.removedFields || []).reduce(
                    (unset: any, removedField: any) => {
                        return {
                            ...unset,
                            [removedField]: undefined,
                        }
                    },
                    {},
                ),
            }

            const unset: Record<string, number> = (event.updateDescription.removedFields || []).reduce(
                (unset: any, removedField: any) => {
                    return {
                        ...unset,
                        [removedField]: 1,
                    }
                },
                {},
            )

            return {
                action: 'update',
                clientAction: 'updated',
                id: event.documentKey._id,
                diff,
                unset,
            }
        }
        case 'delete':
            return {
                action: 'remove',
                clientAction: 'removed',
                id: event.documentKey._id,
            }
    }
}
