import { connect, RedisConnectOptions, RedisValue } from 'redis'

import { CacheClient } from '@/@types/cache.ts'
import Config from '@/config/index.ts'
import { createLogger } from '@/factories/logger-factory.ts'

const debug = createLogger('cache-client')

export const getCacheConfig = (): RedisConnectOptions => ({
    hostname: Config.REDIS_HOST,
    port: Config.REDIS_PORT,
    ...(Config.REDIS_USER && { username: Config.REDIS_USER }),
    ...(Config.REDIS_PASS && { password: Config.REDIS_PASS }),
    maxRetryCount: 100,
    db: Config.REDIS_DB,
    tls: Config.REDIS_TLS,
})

let mainInstance: CacheClient
let cacheInstance: CacheClient

export const getCacheClient = async (useCache?: boolean): Promise<CacheClient> => {
    if (!mainInstance) {
        const config = getCacheConfig()
        const { password: _, ...loggableConfig } = config
        debug('config: %o', loggableConfig)
        if (config.hostname) {
            console.log('🚀 Connecting to Cache Client...')
            mainInstance = await connect(config)
            cacheInstance = await connect(config)
            console.log('🚀 Connected to Cache Client.')
        }
    }

    return useCache ? cacheInstance : mainInstance
}

export async function publish(channel: string, message: RedisValue) {
    const client = await getCacheClient(true)
    return client.publish(channel, message)
}
