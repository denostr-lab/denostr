import 'pg'
import 'pg-query-stream'
import knex, { Knex } from 'knex'
import { createLogger } from '../factories/logger-factory.ts'
import Config from '../config/index.ts'

((knex) => {
  const lastUpdate = {}
  knex.Client.prototype.releaseConnection = function (connection) {
    const released = this.pool.release(connection)

    if (released) {
      const now = new Date().getTime()
      const { tag } = this.config
      lastUpdate[tag] = lastUpdate[tag] ?? now
      if (now - lastUpdate[tag] >= 60000) {
        lastUpdate[tag] = now
        console.log(`${tag} connection pool: ${this.pool.numUsed()} used / ${this.pool.numFree()} free / ${this.pool.numPendingAcquires()} pending`)
      }
    }

    return Promise.resolve()
  }
})(knex)

const getMasterConfig = (): Knex.Config => ({
  tag: 'master',
  client: 'pg',
  connection: Config.DB_URI ? Config.DB_URI : {
    host: Config.DB_HOST,
    port: Number(Config.DB_PORT),
    user: Config.DB_USER,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
  },
  pool: {
    min: Config.DB_MIN_POOL_SIZE ? Number(Config.DB_MIN_POOL_SIZE) : 0,
    max: Config.DB_MAX_POOL_SIZE ? Number(Config.DB_MAX_POOL_SIZE) : 3,
    idleTimeoutMillis: 60000,
    propagateCreateError: false,
    acquireTimeoutMillis: Config.DB_ACQUIRE_CONNECTION_TIMEOUT
    ? Number(Config.DB_ACQUIRE_CONNECTION_TIMEOUT)
    : 60000,
  },
  acquireConnectionTimeout: Config.DB_ACQUIRE_CONNECTION_TIMEOUT
    ? Number(Config.DB_ACQUIRE_CONNECTION_TIMEOUT)
    : 60000,
} as any)

const getReadReplicaConfig = (): Knex.Config => ({
  tag: 'read-replica',
  client: 'pg',
  connection: {
    host: Config.RR_DB_HOST,
    port: Number(Config.RR_DB_PORT),
    user: Config.RR_DB_USER,
    password: Config.RR_DB_PASSWORD,
    database: Config.RR_DB_NAME,
  },
  pool: {
    min: Config.RR_DB_MIN_POOL_SIZE ? Number(Config.RR_DB_MIN_POOL_SIZE) : 0,
    max: Config.RR_DB_MAX_POOL_SIZE ? Number(Config.RR_DB_MAX_POOL_SIZE) : 3,
    idleTimeoutMillis: 60000,
    propagateCreateError: false,
    acquireTimeoutMillis: Config.RR_DB_ACQUIRE_CONNECTION_TIMEOUT
    ? Number(Config.RR_DB_ACQUIRE_CONNECTION_TIMEOUT)
    : 60000,
  },
} as any)

let writeClient: Knex

export const getMasterDbClient = () => {
  const debug = createLogger('database-client:get-db-client')
  if (!writeClient) {
    const config = getMasterConfig()
    debug('config: %o', config)
    writeClient = knex(config)
  }

  return writeClient
}

let readClient: Knex

export const getReadReplicaDbClient = () => {
  if (Config.READ_REPLICA_ENABLED !== 'true') {
    return getMasterDbClient()
  }

  const debug = createLogger('database-client:get-read-replica-db-client')
  if (!readClient) {
    const config = getReadReplicaConfig()
    debug('config: %o', config)
    readClient = knex(config)
  }

  return readClient
}
