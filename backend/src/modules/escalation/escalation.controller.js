// backend/modules/escalation/escalation.controller.js
import * as escalationRepo from './escalation.repository.js';
import { success, error } from '../../utils/apiResponse.js'; // path confirm karna
import { ApiError } from '../../utils/apiError.js'; // path confirm karna

export const listPending = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }
    const tickets = await escalationRepo.listPendingTickets();
    success(res, tickets);
  } catch (err) {
    error(res, err);
  }
};