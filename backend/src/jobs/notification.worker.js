import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

// Simulates sending an email/SMS — real integration (SendGrid/Twilio) would go here
const processNotification = async (job) => {
  const { type, to, message } = job.data;
  await new Promise((resolve) => setTimeout(resolve, 300)); // simulate network call
  logger.info({ type, to }, `Notification sent: ${message}`);
  return { sent: true };
};

export const notificationWorker = new Worker('notifications', processNotification, {
  connection: redis.options,
  concurrency: 5 // 5 notifications process ho sakti hain parallel
});

notificationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, attempts: job.attemptsMade }, `Notification job failed: ${err.message}`);
});

notificationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Notification job completed');
});