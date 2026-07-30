import { maintenanceQueue } from '../config/queue.js';

// App start hote hi ek baar call hoga — repeatable job register karta hai
export const scheduleSlotExpiry = async () => {
  await maintenanceQueue.add(
    'expire-slots',
    {},
    {
      repeat: { every: 15 * 60 * 1000 }, // har 15 minute mein chalega
      jobId: 'expire-slots-recurring' // fixed ID — duplicate schedule accidentally create nahi hogi restart pe
    }
  );
};
export const scheduleAiSlotGeneration = async () => {
  await maintenanceQueue.add(
    'generate-ai-slots',
    {},
    {
      repeat: { every: 24 * 60 * 60 * 1000 }, // daily
      jobId: 'generate-ai-slots-recurring'
    }
  );
};
export const scheduleModerationAutoResolve = async () => {
  await maintenanceQueue.add(
    'resolve-expired-moderation-cases',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // har ghante check karo — 24hr-timeout precise-honi-chahiye, but hourly-check kaafi hai
      jobId: 'resolve-expired-moderation-cases-recurring'
    }
  );
};
export const scheduleConsultationExpiry = async () => {
  await maintenanceQueue.add(
    'expire-consultations',
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // har 5 minute — 30-min-slot ke liye kaafi tight
      jobId: 'expire-consultations-recurring'
    }
  );
};