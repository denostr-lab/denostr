import Config from "./src/config/index.ts";
module.exports = {
  client: "pg",
  connection: Config.DATABASE_URI ? Config.DATABASE_URI : {
    host: Config.DB_HOST ?? "localhost",
    port: Config.DB_PORT ?? 5432,
    user: Config.DB_USER ?? "postgres",
    password: Config.DB_PASSWORD ?? "postgres",
    database: Config.DB_NAME ?? "nostream",
  },
  seeds: {
    directory: "./seeds",
  },
};
