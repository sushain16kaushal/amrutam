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
    // reopenSlot() call hataya — ab zaroorat nahi, kyunki availability
    // hamesha live count (COUNT WHERE status <> 'cancelled') se calculate hoti hai
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
export const getMyConsultations = async (patientId) => {
  return consultRepo.findByPatientId(patientId);
};
export const getAssignedConsultations = async (doctorUserId) => {
  return consultRepo.findByDoctorUserId(doctorUserId);
};

export const hideConsultation = async (patientId, consultationId) => {
  const updated = await consultRepo.hideByPatientId(consultationId, patientId);
  if (!updated) throw new ApiError(404, 'Consultation not found');
  return updated;
};
const completeConsultationSystem = async (consultationId, fromStatus) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await consultRepo.updateStatus(client, consultationId, 'completed');
    await logAction({
      actorId: null, // system-triggered, koi human-actor nahi
      action: 'consultation_auto_completed',
      metadata: { consultationId, from: fromStatus, reason: 'slot_expired' }
    }, client);
    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Single-consultation lazy-check — socket.js isko call karega
export const autoCompleteIfExpired = async (consultation) => {
  if (['completed', 'cancelled'].includes(consultation.status)) return consultation;
  if (new Date(consultation.end_time) > new Date()) return consultation;

  const updated = await completeConsultationSystem(consultation.id, consultation.status);
  return { ...consultation, ...updated }; // status='completed' overwrite, baaki-fields (doctor_kind etc.) preserved
};

// Bulk cron-check — worker isko call karega
export const autoCompleteExpiredConsultations = async () => {
  const expired = await consultRepo.findExpiredActiveConsultations();
  let count = 0;
  for (const row of expired) {
    try {
      await completeConsultationSystem(row.id, row.status);
      count++;
    } catch (err) {
      console.error(`Failed to auto-complete consultation ${row.id}:`, err);
    }
  }
  return count;
};
