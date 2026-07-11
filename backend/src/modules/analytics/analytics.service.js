import redis from '../../config/redis.js';
import * as analyticsRepo from './analytics.repository.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes — analytics real-time hone ki zaroorat nahi

const getCached = async (cacheKey, fetchFn) => {
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const fresh = await fetchFn();
  await redis.set(cacheKey, JSON.stringify(fresh), 'EX', CACHE_TTL_SECONDS);
  return fresh;
};

export const getOverview = () => getCached('analytics:overview', analyticsRepo.getOverview);

export const getConsultationsByDay = (days) =>
  getCached(`analytics:consultations-by-day:${days}`, () => analyticsRepo.getConsultationsByDay(days));

export const getTopSpecialties = (limit) =>
  getCached(`analytics:top-specialties:${limit}`, () => analyticsRepo.getTopSpecialties(limit));

export const getCancellationRate = () => getCached('analytics:cancellation-rate', analyticsRepo.getCancellationRate);