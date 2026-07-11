import * as analyticsService from './analytics.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const overview = async (req, res) => {
  try {
    success(res, await analyticsService.getOverview());
  } catch (err) { error(res, err); }
};

export const consultationsByDay = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30)); // cap 90 days — abuse-proofing
    success(res, await analyticsService.getConsultationsByDay(days));
  } catch (err) { error(res, err); }
};

export const topSpecialties = async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));
    success(res, await analyticsService.getTopSpecialties(limit));
  } catch (err) { error(res, err); }
};

export const cancellationRate = async (req, res) => {
  try {
    success(res, await analyticsService.getCancellationRate());
  } catch (err) { error(res, err); }
};