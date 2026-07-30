import * as reviewsService from './reviews.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const submitReview = async (req, res) => {
  try {
    const review = await reviewsService.submitReview(req.user.id, req.params.consultationId, req.body);
    success(res, review, 201);
  } catch (err) { error(res, err); }
};

export const getDoctorReviews = async (req, res) => {
  try {
    const data = await reviewsService.getDoctorReviews(req.params.doctorId);
    success(res, data);
  } catch (err) { error(res, err); }
};