import * as auditService from './audit.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const list = async (req, res) => {
  try {
    const logs = await auditService.getAuditLogs(req.query);
    success(res, logs);
  } catch (err) { error(res, err); }
};