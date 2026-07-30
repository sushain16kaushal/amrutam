import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import { expireOldOpenSlots } from '../modules/doctors/doctors.repository.js';
import { generateSlotsForAiDoctors } from '../modules/ai-agents/slotManager.service.js';
import { autoResolveExpiredCases } from '../modules/moderation/moderation.service.js'; // NEW — path confirm karna (moderation.service.js jis-folder-mein hai)
import { autoCompleteExpiredConsultations } from '../modules/consultations/consultations.service.js';
const processMaintenance = async (job) => {
  if (job.name === 'expire-slots') {
    const count = await expireOldOpenSlots();
    logger.info({ expiredCount: count }, `Slot expiry job ran — ${count} slots marked expired`);
    return { expiredCount: count };
  }

  if (job.name === 'generate-ai-slots') {
    const count = await generateSlotsForAiDoctors();
    return { createdCount: count };
  }

  if (job.name === 'resolve-expired-moderation-cases') { // NEW
    const { resolvedCount } = await autoResolveExpiredCases();
    logger.info({ resolvedCount }, `Moderation auto-timeout job ran — ${resolvedCount} cases auto-resolved`);
    return { resolvedCount };
  }
  if (job.name === 'expire-consultations') {
    const count = await autoCompleteExpiredConsultations();
    logger.info({ count }, `Consultation expiry job ran — ${count} consultations auto-completed`);
    return { count };
  }
};

export const maintenanceWorker = new Worker('maintenance', processMaintenance, {
  connection: redis.options,
  concurrency: 1
});

maintenanceWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, attempts: job.attemptsMade }, `Maintenance job failed: ${err.message}`);
});

maintenanceWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Maintenance job completed');
});