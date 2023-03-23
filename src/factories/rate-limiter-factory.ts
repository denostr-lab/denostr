import Config from '../config/index.ts'
import { ICacheAdapter } from '../@types/adapters.ts'
import { IRateLimiter } from '../@types/utils.ts'
import { RedisAdapter } from '../adapters/redis-adapter.ts'
import { RedisSetAdapter } from '../adapters/inmemory-cache-adapter.ts'

import { getCacheClient } from '../cache/client.ts'
import { SlidingWindowRateLimiter } from '../utils/sliding-window-rate-limiter.ts'

let instance: IRateLimiter | undefined = undefined

export const slidingWindowRateLimiterFactory = async () => {
    if (!instance) {
        let cache: ICacheAdapter | null = null
        if (Config.REDIS_HOST && Config.REDIS_PORT) {
            cache = new RedisAdapter(await getCacheClient())
        } else {
            cache = new RedisSetAdapter()
        }
        instance = new SlidingWindowRateLimiter(cache)
    }

    return instance
}
