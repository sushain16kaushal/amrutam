import { Queue } from 'bullmq';
import redis from './redis.js';

// BullMQ needs its own ioredis-compatible connection options, not the same client instance
export const notificationQueue = new Queue('notifications', {
  connection: redis.options,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 }, // matches our documented retry/backoff strategy
    removeOnComplete: 100, // keep last 100 for debugging, don't grow unbounded
    removeOnFail: 500      // failed jobs kept longer — dead-letter-ish inspection
  }
});