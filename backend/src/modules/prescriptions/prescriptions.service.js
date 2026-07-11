import * as prescriptionsRepo from './prescriptions.repository.js';
import * as consultRepo from '../consultations/consultations.repository.js';
import { ApiError } from '../../utils/apiError.js';
import { logAction } from '../../utils/auditLogger.js';
const PRESCRIBABLE_STATUSES = ['in_progress', 'completed'];

export const createPrescription = async (userId, consultationId, details) => {
  if (!details || details.trim().length === 0) {
    throw new ApiError(400, 'Prescription details are required');
  }

  const consultation = await consultRepo.findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');

  if (consultation.doctor_user_id !== userId) {
    throw new ApiError(403, 'Only the assigned doctor can write a prescription');
  }
  if (!PRESCRIBABLE_STATUSES.includes(consultation.status)) {
    throw new ApiError(400, `Cannot prescribe while consultation is '${consultation.status}'`);
  }
  return prescriptionsRepo.create({ consultationId, details });
    const prescription = await prescriptionsRepo.create({ consultationId, details });
  await logAction({ actorId: userId, action: 'prescription_created', metadata: { consultationId, prescriptionId: prescription.id } });
  return prescription;
};

export const getPrescriptions = async (userId, consultationId) => {
  const consultation = await consultRepo.findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');

  const isPatient = consultation.patient_id === userId;
  const isDoctor = consultation.doctor_user_id === userId;
  if (!isPatient && !isDoctor) {
    throw new ApiError(403, 'You are not part of this consultation');
  }

  return prescriptionsRepo.findByConsultationId(consultationId);
};