import * as moderationService from './moderation.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const listPending = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return error(res, { statusCode: 403, message: 'Admin access required' });
    }
    const cases = await moderationService.listPendingCases();
    success(res, cases);
  } catch (err) { error(res, err); }
};

export const resolve = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return error(res, { statusCode: 403, message: 'Admin access required' });
    }
    const updated = await moderationService.resolveModerationCase(req.params.caseId, req.body);
    success(res, updated);
  } catch (err) { error(res, err); }
};