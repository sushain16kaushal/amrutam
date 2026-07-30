import * as doctorsRepo from '../doctors/doctors.repository.js';
import logger from '../../utils/logger.js';

const SLOT_INTERVAL_MINUTES = 30;
const SLOTS_PER_DAY = (24 * 60) / SLOT_INTERVAL_MINUTES; // 48 — poore din ke back-to-back 30-min slots
const DAYS_AHEAD = 7;
const AI_SLOT_CAPACITY = 15;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const generateSlotsForAiDoctors = async () => {
  const aiDoctors = await doctorsRepo.findAiDoctors();
  let totalCreated = 0;

  for (const doctor of aiDoctors) {
    for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
      const dayStart = startOfDay(new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const existingCount = await doctorsRepo.countOpenSlotsForDoctorInRange(doctor.id, dayStart, dayEnd);
      if (existingCount > 0) continue;

      for (let i = 0; i < SLOTS_PER_DAY; i++) {
        const start = new Date(dayStart.getTime() + i * SLOT_INTERVAL_MINUTES * 60 * 1000);
        const end = new Date(start.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);

        await doctorsRepo.createSlot({
          doctorId: doctor.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          capacity: AI_SLOT_CAPACITY
        });
        totalCreated++;
      }
    }
  }

  logger.info({ totalCreated, aiDoctorCount: aiDoctors.length }, `AI slot generation ran — ${totalCreated} slots created`);
  return totalCreated;
};