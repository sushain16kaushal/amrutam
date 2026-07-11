import pg from 'pg';
import { env } from './env.js';

const pool = new pg.Pool({ connectionString: env.databaseUrl });

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

export default pool;