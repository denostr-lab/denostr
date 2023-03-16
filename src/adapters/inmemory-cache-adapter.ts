import { Bulk, RedisValue } from 'redis'
import TTLCache from 'npm:@isaacs/ttlcache'
import { ICacheAdapter } from '../@types/adapters.ts'
import { createLogger } from '../factories/logger-factory.ts'

const debug = createLogger('redis-adapter')

export class RedisSetAdapter implements ICacheAdapter {
    private client: TTLCache<string, any>
    public constructor() {
        this.client = new TTLCache({ max: 100000, ttl: 1000 * 60 * 60 })
    }

    public async hasKey(key: string): Promise<boolean> {
        debug('has %s key', key)

        return this.client.has(key)
    }

    public async getKey(key: string): Promise<Bulk> {
        debug('get %s key', key)
        return this.client.get(key) as Bulk
    }

    public async setKey(key: string, value: string): Promise<boolean> {
        debug('get %s key', key)
        return !!this.client.set(key, value)
    }

    public async removeRangeByScoreFromSortedSet(
        key: string,
        min: number,
        max: number,
    ): Promise<any> {


        debug('remove %d..%d range from sorted set %s', min, max, key)
        const rowValue = this.client.get(key)
        const result = rowValue.filter((i: [number, RedisValue]) => i[0] < min || i[0] > max)
        return this.client.set(key, result)
    }

    public async getRangeFromSortedSet(
        key: string,
        min: number,
        max: number,
    ): Promise<string[]> {

        debug('get %d..%d range from sorted set %s', min, max, key)
        const rowValue = this.client.get(key)
        const result = rowValue.filter((i: [number, RedisValue]) => i[0] >= min && i[0] <= max)
        return result
    }

    public async setKeyExpiry(key: string, expiry: number): Promise<void> {

        debug('expire at %d from sorted set %s', expiry, key)

        await this.client.get(key, { updateAgeOnGet: true, ttl: expiry })
    }

    public async addToSortedSet(
        key: string,
        set: Record<string, string>,
    ): Promise<any> {
  
        debug('add %o to sorted set %s', set, key)
        const members: [number, RedisValue][] = Object
            .entries(set)
            .map(([value, score]) => [Number(score), value])
        const result = this.client.set(key, members)
        return result
    }
}
