import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { Tor } from 'npm:tor-control-ts@1.0.0'

import { TorConfig } from '../@types/tor.ts'
import Config from '../config/index.ts'
import { createLogger } from '../factories/logger-factory.ts'

const debug = createLogger('tor-client')

const getPrivateKeyFile = () => {
    return join(
        Config.NOSTR_CONFIG_DIR ?? join(homedir(), '.nostr'),
        'v3_onion_private_key',
    )
}

export const createTorConfig = (): TorConfig => {
    return {
        host: Config.TOR_HOST,
        port: Config.TOR_CONTROL_PORT ? Number(Config.TOR_CONTROL_PORT) : 9051,
        password: Config.TOR_PASSWORD,
    }
}

let client: Tor | undefined

export const getTorClient = async () => {
    if (!client) {
        const config = createTorConfig()
        debug('config: %o', config)

        if (config.host !== undefined) {
            debug('connecting')
            client = new Tor(config)
            try {
                await client.connect()
            } catch {
                client = undefined
            }
            debug('connected')
        }
    }

    return client
}
export const closeTorClient = async () => {
    if (client) {
        await client.quit()
        client = undefined
    }
}

export const addOnion = async (
    port: number,
    host?: string,
): Promise<string> => {
    let privateKey = null
    const path = getPrivateKeyFile()

    try {
        debug('reading private key from %s', path)
        const data = await readFile(path, 'utf8')
        if (data?.length) {
            privateKey = data
            debug('privateKey: %o', privateKey)
        }
    } catch (error) {
        debug('error reading private key: %o', error)
    }

    const client = await getTorClient()
    if (client) {
        const hiddenService = await client.addOnion(port, host, privateKey)
        debug('hidden service: %s:%d', hiddenService.ServiceID, port)

        if (hiddenService?.PrivateKey) {
            console.log('saving private key to %s', path)
            debug('saving private key to %s', path)

            await writeFile(path, hiddenService.PrivateKey, 'utf8')
            return hiddenService.ServiceID
        } else {
            throw new Error(JSON.stringify(hiddenService))
        }
    } else {
        throw new Error('not connect')
    }
}
