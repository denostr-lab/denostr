import { Bulk } from 'redis'
import TTLCache from 'npm:@isaacs/ttlcache'
import { ICacheAdapter } from '../@types/adapters.ts'
import { createLogger } from '../factories/logger-factory.ts'

const debug = createLogger('redis-adapter')

export class InMemmoryCacheAdapter implements ICacheAdapter {
    #client: Map<any, any>

    public constructor() {
        this.#client = new Map()
    }

    public async hasKey(key: string): Promise<boolean> {
        debug('has %s key', key)

        return this.#client.has(key)
    }

    public async getKey(key: string): Promise<Bulk> {
        debug('get %s key', key)

        return this.#client.get(key) as Bulk
    }

    public async setKey(key: string, value: string): Promise<boolean> {
        debug('get %s key', key)

        return !!this.#client.set(key, value)
    }

    public async removeRangeByScoreFromSortedSet(
        key: string,
        min: number,
        max: number,
    ): Promise<any> {
        debug('remove %d..%d range from sorted set %s', min, max, key)

        const sortedSet = this.#getSortedSet(key)
        for (const key of sortedSet.keys()) {
            if (sortedSet.has(key)) {
                if (key >= min && key <= max) {
                    sortedSet.delete(key)
                }
            }
        }

        return sortedSet.size
    }

    public async getRangeFromSortedSet(
        key: string,
        min: number,
        max: number,
    ): Promise<string[]> {
        const sortedSet = this.#getSortedSet(key)
        if (max === -1) {
            max = sortedSet.size
        }
        debug('get %d..%d range from sorted set %s', min, max, key)

        return [...sortedSet.values()].slice(min, max)
    }

    public async setKeyExpiry(key: string, expiry: number): Promise<void> {
        debug('expire at %d from sorted set %s', expiry, key)
        // await this.#client.get(key, { updateAgeOnGet: true, ttl: expiry })
    }

    public async addToSortedSet(
        key: string,
        set: Record<string, string>,
        expiry?: number,
    ): Promise<any> {
        debug('add %o to sorted set %s', set, key)

        const sortedSet = this.#getSortedSet(key)
        Object.entries(set).forEach(([value, score]) => {
            sortedSet.set(Number(score), value, { ttl: expiry })
        })

        return 1
    }

    #getSortedSet(key: string) {
        let rowValus = this.#client.get(`sorted-set:${key}`)
        if (!rowValus) {
            rowValus = new TTLCache({ max: 100000 })
        }
        this.#client.set(`sorted-set:${key}`, rowValus)

        return (rowValus as TTLCache<any, string>)
    }
}
