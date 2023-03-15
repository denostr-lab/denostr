import { config } from "dotenv";

config({ export: true });

const Config = {
  HIDDEN_SERVICE_PORT: Deno.env.get("HIDDEN_SERVICE_PORT"),
  RELAY_PORT: Deno.env.get("RELAY_PORT"),
  SECRET: Deno.env.get("SECRET"),
  WORKER_COUNT: Deno.env.get("WORKER_COUNT"),
  DB_URI: Deno.env.get("DB_URI"),
  DB_HOST: Deno.env.get("DB_HOST"),
  DB_PORT: Deno.env.get("DB_PORT"),
  DB_USER: Deno.env.get("DB_USER"),
  DB_PASSWORD: Deno.env.get("DB_PASSWORD"),
  DB_NAME: Deno.env.get("DB_NAME"),
  DB_MIN_POOL_SIZE: Deno.env.get("DB_MIN_POOL_SIZE"),
  DB_MAX_POOL_SIZE: Deno.env.get("DB_MAX_POOL_SIZE"),
  DB_ACQUIRE_CONNECTION_TIMEOUT: Deno.env.get("DB_ACQUIRE_CONNECTION_TIMEOUT"),
  RR_DB_HOST: Deno.env.get("RR_DB_HOST"),
  RR_DB_PORT: Deno.env.get("RR_DB_PORT"),
  RR_DB_USER: Deno.env.get("RR_DB_USER"),
  RR_DB_PASSWORD: Deno.env.get("RR_DB_PASSWORD"),
  RR_DB_NAME: Deno.env.get("RR_DB_NAME"),
  RR_DB_MIN_POOL_SIZE: Deno.env.get("RR_DB_MIN_POOL_SIZE"),
  RR_DB_MAX_POOL_SIZE: Deno.env.get("RR_DB_MAX_POOL_SIZE"),
  RR_DB_ACQUIRE_CONNECTION_TIMEOUT: Deno.env.get(
    "RR_DB_ACQUIRE_CONNECTION_TIMEOUT",
  ),
  READ_REPLICA_ENABLED: Deno.env.get("READ_REPLICA_ENABLED"),
  ZEBEDEE_API_KEY: Deno.env.get("ZEBEDEE_API_KEY"),
  LNBITS_API_KEY: Deno.env.get("LNBITS_API_KEY"),
  NOSTR_CONFIG_DIR: Deno.env.get("NOSTR_CONFIG_DIR"),
  TOR_HOST: Deno.env.get("TOR_HOST"),
  TOR_CONTROL_PORT: Deno.env.get("TOR_CONTROL_PORT"),
  TOR_PASSWORD: Deno.env.get("TOR_PASSWORD"),
  RELAY_PRIVATE_KEY: Deno.env.get("RELAY_PRIVATE_KEY"),
  WORKER_TYPE: Deno.env.get("WORKER_TYPE"),
  DATABASE_URI: Deno.env.get("DATABASE_URI"),
  MIRROR_INDEX: Deno.env.get("MIRROR_INDEX"),
  PORT: Deno.env.get("PORT"),
  REDIS_HOST: Deno.env.get("REDIS_HOST"),
  REDIS_PORT: Deno.env.get("REDIS_PORT"),
};
export default Config;
