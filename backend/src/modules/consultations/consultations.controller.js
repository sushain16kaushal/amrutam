import * as consultService from './consultations.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const updateStatus = async (req, res) => {
  try {
    const result = await consultService.updateConsultationStatus(req.user.id, req.params.id, req.body.status);
    success(res, result);
  } catch (err) { error(res, err); }
};

export const cancel = async (req, res) => {
  try {
    const result = await consultService.cancelConsultation(req.user.id, req.params.id);
    success(res, result);
  } catch (err) { error(res, err); }
};

export const getOne = async (req, res) => {
  try {
    const result = await consultService.getConsultation(req.user.id, req.params.id);
    success(res, result);
  } catch (err) { error(res, err); }
};