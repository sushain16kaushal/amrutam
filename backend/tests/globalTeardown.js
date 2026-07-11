import pool from '../src/config/db.js';
import redis from '../src/config/redis.js';

export default async () => {
  await pool.end();       // Postgres connection pool close karo
  redis.disconnect();     // Redis connection close karo
};