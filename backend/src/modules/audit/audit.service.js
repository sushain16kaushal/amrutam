import * as auditRepo from './audit.repository.js';

export const getAuditLogs = async (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return auditRepo.listLogs({ ...query, page, limit });
};