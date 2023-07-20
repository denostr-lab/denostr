import mongoose from 'mongoose'

import Config from '../config/index.ts'
import { createLogger } from '../factories/logger-factory.ts'

const getMasterConfig = () => {
    const mongoUri = Config.MONGO_URI
    if (!mongoUri) {
        console.error('🚨 You may have entered an incorrect MONGO_URI environment variable.')
        return Deno.exit(1)
    }

    return {
        connection: mongoUri,
        pool: {
            min: Config.MONGO_MIN_POOL_SIZE,
            max: Config.MONGO_MAX_POOL_SIZE,
        },
        tag: mongoose.mongo.ReadPreference.PRIMARY,
        dbName: Config.MONGO_DB_NAME,
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
            dbName: config.dbName,
            retryWrites: true,
        })
        writeClient.on('open', () => {
            console.log('🚀 Connecting to database. selected db of', writeClient.name)
        })
        writeClient.on('error', () => {
            console.log('💥 Unable to connect to database')
        })
    }

    return writeClient
}

const getReadReplicaConfig = () => {
    const mongoUri = Config.MONGO_URI
    if (!mongoUri) {
        console.error('🚨 You may have entered an incorrect MONGO_URI environment variable.')
        return Deno.exit(1)
    }

    return {
        connection: mongoUri,
        pool: {
            min: Config.MONGO_RR_MIN_POOL_SIZE,
            max: Config.MONGO_RR_MAX_POOL_SIZE,
        },
        tag: mongoose.mongo.ReadPreference.SECONDARY,
        dbName: Config.MONGO_DB_NAME,
    }
}

let readClient: mongoose.Connection

export const getReadReplicaDbClient = () => {
    if (!Config.MONGO_RR_ENABLED) {
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
            dbName: config.dbName,
            retryReads: true,
        })
        readClient.on('open', () => {
            console.log('🚀 Connected to secondary database. selected db of', readClient.name)
        })
        readClient.on('error', () => {
            console.log('💥 Unable to connect to secondary database')
        })
    }

    return readClient
}
