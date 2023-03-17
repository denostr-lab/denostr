import mongoose from 'npm:mongoose'

import Config from '../config/index.ts'
import { createLogger } from '../factories/logger-factory.ts'

const getMasterConfig = () => {
    const mongoUri = (Deno.env.get('MONGO_URI') || '').trim()
    if (!mongoUri) {
        return Deno.exit(1)
    }

    return {
        connection: mongoUri,
        pool: {
            min: Config.DB_MIN_POOL_SIZE ? Number(Config.DB_MIN_POOL_SIZE) : 0,
            max: Config.DB_MAX_POOL_SIZE ? Number(Config.DB_MAX_POOL_SIZE) : 3,
        },
        tag: mongoose.mongo.ReadPreference.PRIMARY,
    }
}

let writeClient: mongoose.Connection

export const getMasterDbClient = () => {
    const debug = createLogger('database-client:get-db-client')
    if (!writeClient) {
        const config = getMasterConfig()
        debug('config: %o', config)
        writeClient = mongoose.createConnection(config.connection, {
            readPreference: config.tag,
            maxPoolSize: config.pool.max,
            minPoolSize: config.pool.min,
        })
        writeClient.on('open', () => {
            console.log('Connected to database')
        })
        writeClient.on('error', () => {
            console.log('Unable to connect to database')
        })
    }

    return writeClient
}

const getReadReplicaConfig = () => {
    const mongoUri = (Deno.env.get('MONGO_URI') || '').trim()
    if (!mongoUri) {
        return Deno.exit(1)
    }

    return {
        connection: mongoUri,
        pool: {
            min: Config.DB_MIN_POOL_SIZE ? Number(Config.DB_MIN_POOL_SIZE) : 0,
            max: Config.DB_MAX_POOL_SIZE ? Number(Config.DB_MAX_POOL_SIZE) : 3,
        },
        tag: mongoose.mongo.ReadPreference.SECONDARY,
    }
}

let readClient: mongoose.Connection

export const getReadReplicaDbClient = () => {
    if (!Config.READ_REPLICA_ENABLED) {
        return getMasterDbClient()
    }

    const debug = createLogger('database-client:get-read-replica-db-client')
    if (!readClient) {
        const config = getReadReplicaConfig()
        debug('config: %o', config)
        readClient = mongoose.createConnection(config.connection, {
            readPreference: config.tag,
            maxPoolSize: config.pool.max,
            minPoolSize: config.pool.min,
        })
        readClient.on('open', () => {
            console.log('Connected to secondary database')
        })
        readClient.on('error', () => {
            console.log('Unable to connect to secondary database')
        })
    }

    return readClient
}
