import * as refundsRepo from './refunds.repository.js';
import { findConsultationWithParties } from '../consultations/consultations.repository.js';
import { ApiError } from '../../utils/apiError.js';
import { logAction } from '../../utils/auditLogger.js';

export const requestRefund = async (patientId, consultationId, { reason }) => {
  const consultation = await findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');
  if (consultation.patient_id !== patientId) throw new ApiError(403, 'You are not part of this consultation');
  if (consultation.status !== 'completed') throw new ApiError(400, 'Refunds can only be requested for completed consultations');

  const existing = await refundsRepo.findByConsultationId(consultationId);
  if (existing) throw new ApiError(409, 'A refund request already exists for this consultation');

  const request = await refundsRepo.createRequest({ consultationId, patientId, reason });
  await logAction({ actorId: patientId, action: 'refund_requested', metadata: { consultationId, requestId: request.id } });
  return request;
};

export const getPendingRequests = async () => refundsRepo.findPending();
export const getMyRequests = async (patientId) => refundsRepo.findMineByPatientId(patientId);

export const approveRequest = async (adminId, requestId) => {
  const request = await refundsRepo.findById(requestId);
  if (!request) throw new ApiError(404, 'Refund request not found');
  if (request.status !== 'pending') throw new ApiError(400, `Request is already '${request.status}'`);

  const updated = await refundsRepo.updateStatus(requestId, 'approved', null);
  await logAction({ actorId: adminId, action: 'refund_approved', metadata: { requestId } });
  return updated;
};

export const rejectRequest = async (adminId, requestId, adminMessage) => {
  const request = await refundsRepo.findById(requestId);
  if (!request) throw new ApiError(404, 'Refund request not found');
  if (request.status !== 'pending') throw new ApiError(400, `Request is already '${request.status}'`);

  const updated = await refundsRepo.updateStatus(requestId, 'rejected', adminMessage);
  await logAction({ actorId: adminId, action: 'refund_rejected', metadata: { requestId, adminMessage } });
  return updated;
};