import pool from '../../config/db.js';
import * as consultRepo from './consultations.repository.js';
import { ApiError } from '../../utils/apiError.js';
import { logAction } from '../../utils/auditLogger.js';

const VALID_TRANSITIONS = {
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
};

export const updateConsultationStatus = async (userId, consultationId, newStatus) => {
  const consultation = await consultRepo.findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');

  // Sirf assigned doctor hi status update kar sakta hai (patient nahi)
  if (consultation.doctor_user_id !== userId) {
    throw new ApiError(403, 'Only the assigned doctor can update this consultation');
  }

  const allowedNext = VALID_TRANSITIONS[consultation.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new ApiError(400, `Cannot move from '${consultation.status}' to '${newStatus}'`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await consultRepo.updateStatus(client, consultationId, newStatus);
    await logAction({ actorId: userId, action: 'consultation_status_changed', metadata: { consultationId, from: consultation.status, to: newStatus } }, client);
    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const cancelConsultation = async (userId, consultationId) => {
  const consultation = await consultRepo.findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');

  const isPatient = consultation.patient_id === userId;
  const isDoctor = consultation.doctor_user_id === userId;
  if (!isPatient && !isDoctor) {
    throw new ApiError(403, 'You are not part of this consultation');
  }

  if (consultation.status !== 'confirmed') {
    throw new ApiError(400, `Cannot cancel a consultation that is '${consultation.status}'`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await consultRepo.updateStatus(client, consultationId, 'cancelled');
    await consultRepo.reopenSlot(client, consultation.slot_id); // saga: slot wapas book-able ban jaye
    await logAction({ actorId: userId, action: 'consultation_cancelled', metadata: { consultationId, slotId: consultation.slot_id } }, client);
    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getConsultation = async (userId, consultationId) => {
  const consultation = await consultRepo.findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');

  const isPatient = consultation.patient_id === userId;
  const isDoctor = consultation.doctor_user_id === userId;
  if (!isPatient && !isDoctor) {
    throw new ApiError(403, 'You are not part of this consultation');
  }
  return consultation;
};