import Redis from 'ioredis';
import { env } from './env.js';

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null // BullMQ requirement — humara normal app code isse unaffected rahega
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

export default redis;