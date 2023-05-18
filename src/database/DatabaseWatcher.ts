import EventEmitter from 'events'
import type { ChangeStreamDeleteDocument, ChangeStreamInsertDocument, ChangeStreamUpdateDocument, Db, WithId, ObjectId, ChangeStream } from 'mongodb'

import { convertChangeStreamPayload, IRecord } from './convertChangeStreamPayload.ts'
import watchCollections from './watchCollections.ts'

export type RecordDeleted<T> = WithId<T> & {
    _updatedAt: Date
    _deletedAt: Date
    __collection__: string
}

const instancePing = parseInt(String(Deno.env.get('MULTIPLE_INSTANCES_PING_INTERVAL'))) || 10000

const maxDocMs = instancePing * 4 // 4 times the ping interval

export type RealTimeData<T> = {
    id: ObjectId
    action: 'insert' | 'update' | 'remove'
    clientAction: 'inserted' | 'updated' | 'removed'
    data?: T
    diff?: Record<string, any>
    unset?: Record<string, number>
    oplog?: true
}

export class DatabaseWatcher extends EventEmitter {
    private db: Db

    private metrics?: any

    private changeStream: ChangeStream

    /**
     * Last doc timestamp received from a real time event
     */
    private lastDocTS: Date | undefined

    constructor(
        { db, metrics }: {
            db: Db
            metrics?: any
        },
    ) {
        super()

        this.db = db
        this.metrics = metrics
    }

    async watch(): Promise<void> {
        try {
            this.watchChangeStream()
        } catch (_err: unknown) {
            throw new Error('MongoDB ChangeStream is not supported')
        }
    }

    private watchChangeStream(): void {
        try {
            this.changeStream = this.db.watch<
                IRecord,
                | ChangeStreamInsertDocument<IRecord>
                | ChangeStreamUpdateDocument<IRecord>
                | ChangeStreamDeleteDocument<IRecord>
            >([
                {
                    $match: {
                        'operationType': { $in: ['insert', 'update', 'delete'] },
                        'ns.coll': { $in: watchCollections },
                    },
                },
            ])
            this.changeStream.on('change', this.onChangeStreamChange)
            this.changeStream.on('error', this.onChangeStreamError)

            console.log('Using change streams')
        } catch (err: unknown) {
            console.error(err, 'Change stream error')

            throw err
        }
    }

    public async close() {
        if (this.changeStream) {
            this.removeAllListeners()
            this.changeStream.removeAllListeners()
            await this.changeStream.close()
        }
    }

    private onChangeStreamChange = (event: any) => {
        this.emitDoc(event.ns.coll, convertChangeStreamPayload(event))
    }

    private onChangeStreamError = (err: any) => {
        throw err
    }

    private emitDoc(
        collection: string,
        doc: RealTimeData<IRecord> | void,
    ): void {
        if (!doc) {
            return
        }

        this.lastDocTS = new Date()

        this.metrics?.oplog.inc({
            collection,
            op: doc.action,
        })

        this.emit(collection, doc)
    }

    on<T>(collection: string, callback: (event: RealTimeData<T>) => void): this {
        return super.on(collection, callback)
    }

    /**
     * @returns the last timestamp delta in miliseconds received from a real time event
     */
    getLastDocDelta(): number {
        return this.lastDocTS ? Date.now() - this.lastDocTS.getTime() : Infinity
    }

    /**
     * @returns Indicates if the last document received is older than it should be. If that happens,
     * it means that the oplog is not working properly
     */
    isLastDocDelayed(): boolean {
        return this.getLastDocDelta() > maxDocMs
    }
}
