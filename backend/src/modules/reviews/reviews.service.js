import * as reviewsRepo from './reviews.repository.js';
import { findConsultationWithParties } from '../consultations/consultations.repository.js';
import { ApiError } from '../../utils/apiError.js';

export const submitReview = async (patientId, consultationId, { rating, reviewText }) => {
  const consultation = await findConsultationWithParties(consultationId);
  if (!consultation) throw new ApiError(404, 'Consultation not found');
  if (consultation.patient_id !== patientId) throw new ApiError(403, 'You are not part of this consultation');
  if (consultation.status !== 'completed') throw new ApiError(400, 'Can only review completed consultations');

  return reviewsRepo.createReview({
    consultationId,
    patientId,
    doctorId: consultation.doctor_id, // findConsultationWithParties ke JOIN se already milta hai
    rating,
    reviewText
  });
};

export const getDoctorReviews = async (doctorId) => {
  const [reviews, ratingSummary] = await Promise.all([
    reviewsRepo.findByDoctorId(doctorId),
    reviewsRepo.getAverageRating(doctorId)
  ]);
  return {
    reviews,
    averageRating: ratingSummary.average ? Number(ratingSummary.average) : null,
    totalReviews: ratingSummary.total
  };
};