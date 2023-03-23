import { Bulk, RedisValue } from 'redis'

import { ICacheAdapter } from '../@types/adapters.ts'
import { CacheClient } from '../@types/cache.ts'
import { createLogger } from '../factories/logger-factory.ts'

const debug = createLogger('redis-adapter')

export class RedisAdapter implements ICacheAdapter {
    private connection: Promise<void>

    public constructor(private readonly client: CacheClient) {
        this.connection = client.connect()

        this.connection.catch((error) => this.onClientError(error))
    }

    private onClientError(error: Error) {
        console.error('Unable to connect to Redis.', error)
        // throw error
    }

    public async hasKey(key: string): Promise<boolean> {
        await this.connection
        debug('has %s key', key)
        return Boolean(this.client.exists(key))
    }

    public async getKey(key: string): Promise<Bulk> {
        await this.connection
        debug('get %s key', key)
        return this.client.get(key)
    }

    public async setKey(key: string, value: string): Promise<boolean> {
        await this.connection
        debug('get %s key', key)
        return 'OK' === await this.client.set(key, value)
    }

    public async removeRangeByScoreFromSortedSet(
        key: string,
        min: number,
        max: number,
    ): Promise<number> {
        await this.connection
        debug('remove %d..%d range from sorted set %s', min, max, key)
        return this.client.zremrangebyscore(key, min, max)
    }

    public async getRangeFromSortedSet(
        key: string,
        min: number,
        max: number,
    ): Promise<string[]> {
        await this.connection
        debug('get %d..%d range from sorted set %s', min, max, key)
        return this.client.zrange(key, min, max)
    }

    public async setKeyExpiry(key: string, expiry: number): Promise<void> {
        await this.connection
        debug('expire at %d from sorted set %s', expiry, key)
        await this.client.expire(key, expiry)
    }

    public async addToSortedSet(
        key: string,
        set: Record<string, string>,
    ): Promise<number> {
        await this.connection
        debug('add %o to sorted set %s', set, key)
        const members: [number, RedisValue][] = Object
            .entries(set)
            .map(([value, score]) => [Number(score), value])

        return this.client.zadd(key, members, {})
    }
}
