import * as messagesRepo from './messages.repository.js';
import { findConsultationWithParties } from '../consultations/consultations.repository.js';
import { ApiError } from '../../utils/apiError.js';

export const verifyParticipant = async (userId, consultationId) => {
  const consultation = await findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');
  const isPatient = consultation.patient_id === userId;
  const isDoctor = consultation.doctor_user_id === userId;
  if (!isPatient && !isDoctor) throw new ApiError(403, 'You are not part of this consultation');
  return consultation;
};

export const getHistory = async (userId, consultationId) => {
  await verifyParticipant(userId, consultationId);
  return messagesRepo.findByConsultationId(consultationId);
};

export const saveImageMessage = async (userId, consultationId, imagePath) => {
  await verifyParticipant(userId, consultationId);
  return messagesRepo.createMessage({
    consultationId, senderId: userId, messageType: 'image', content: imagePath
  });
};