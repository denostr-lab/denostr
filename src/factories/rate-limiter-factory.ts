import { ICacheAdapter } from '../@types/adapters.ts'
import { IRateLimiter } from '../@types/utils.ts'
import { RedisAdapter } from '../adapters/redis-adapter.ts'
import { getCacheClient } from '../cache/client.ts'
import { SlidingWindowRateLimiter } from '../utils/sliding-window-rate-limiter.ts'

let instance: IRateLimiter | undefined = undefined

export const slidingWindowRateLimiterFactory = async () => {
  if (!instance) {
    const cache: ICacheAdapter = new RedisAdapter(await getCacheClient())
    instance = new SlidingWindowRateLimiter(cache)
  }

  return instance
}
