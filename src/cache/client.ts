import { connect, RedisConnectOptions } from 'redis'

import { CacheClient } from '../@types/cache.ts'
import Config from '../config/index.ts'
import { createLogger } from '../factories/logger-factory.ts'


const debug = createLogger('cache-client')

export const getCacheConfig = (): RedisConnectOptions => ({
  hostname: Config.REDIS_HOST as string,
  port: Config.REDIS_PORT as string,
  maxRetryCount: 100,
})

let instance: CacheClient | undefined = undefined

export const getCacheClient = async (): Promise<CacheClient> => {
  if (!instance) {
    const config = getCacheConfig()
    debug('config: %o', config)
    instance = await connect(config)
  }

  return instance
}
