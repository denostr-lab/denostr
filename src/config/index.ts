import { config } from 'dotenv'

config({ export: true })

const Config = {
    HIDDEN_SERVICE_PORT: Deno.env.get('HIDDEN_SERVICE_PORT'),
    RELAY_PORT: Deno.env.get('RELAY_PORT'),
    SECRET: (Deno.env.get('SECRET') || 'abcdefghijklmnopqrstuvwxyz1234567890').trim(),
    MONGO_URI: (Deno.env.get('MONGO_URI') || '').trim(),
    MONGO_DB_NAME: (Deno.env.get('MONGO_DB_NAME') || 'denostr').trim(),
    MONGO_MIN_POOL_SIZE: Number(Deno.env.get('MONGO_MIN_POOL_SIZE') || 8),
    MONGO_MAX_POOL_SIZE: Number(Deno.env.get('MONGO_MAX_POOL_SIZE') || 16),
    MONGO_RR_ENABLED: Boolean(Deno.env.get('MONGO_RR_ENABLED')),
    MONGO_RR_MIN_POOL_SIZE: Number(Deno.env.get('MONGO_RR_MIN_POOL_SIZE') || 3),
    MONGO_RR_MAX_POOL_SIZE: Number(Deno.env.get('MONGO_RR_MAX_POOL_SIZE') || 5),
    ZEBEDEE_API_KEY: Deno.env.get('ZEBEDEE_API_KEY'),
    LNBITS_API_KEY: Deno.env.get('LNBITS_API_KEY'),
    NODELESS_API_KEY: Deno.env.get('NODELESS_API_KEY'),
    NODELESS_WEBHOOK_SECRET: Deno.env.get('NODELESS_WEBHOOK_SECRET') || '',
    OPENNODE_API_KEY: Deno.env.get('OPENNODE_API_KEY'),
    NOSTR_CONFIG_DIR: Deno.env.get('NOSTR_CONFIG_DIR'),
    TOR_HOST: Deno.env.get('TOR_HOST'),
    TOR_CONTROL_PORT: Deno.env.get('TOR_CONTROL_PORT'),
    TOR_PASSWORD: Deno.env.get('TOR_PASSWORD'),
    RELAY_PRIVATE_KEY: Deno.env.get('RELAY_PRIVATE_KEY'),
    WORKER_TYPE: Deno.env.get('WORKER_TYPE'),
    MIRROR_INDEX: Deno.env.get('MIRROR_INDEX'),
    PORT: Deno.env.get('PORT'),
    REDIS_HOST: String(Deno.env.get('REDIS_HOST') || ''),
    REDIS_PORT: Number(Deno.env.get('REDIS_PORT') || 6379),
    REDIS_DB: Number(Deno.env.get('REDIS_DB') || 0),
    REDIS_USER: Deno.env.get('REDIS_USER'),
    REDIS_PASS: Deno.env.get('REDIS_PASS'),
    REDIS_TLS: (() => {
        const tlsEnable = Deno.env.get('REDIS_TLS') as unknown as string
        if (tlsEnable && ['true', 'false'].includes(tlsEnable)) {
            return tlsEnable === 'true'
        }
        return false
    })(),
}

export default Config
