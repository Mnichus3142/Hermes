import { env } from "$env/dynamic/private";
import postgres from "postgres";

const sql = postgres({
  host: env.HOST,
  port: Number(env.PORT),
  database: env.DATABASE,
  user: env.DATABASE_USER,
  password: env.PASSWORD,
  ssl: env.SSL_ENABLED === "true" 
    ? { rejectUnauthorized: false }
    : false,
});

export default sql;
