import * as prescriptionsService from './prescriptions.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const create = async (req, res) => {
  try {
    const result = await prescriptionsService.createPrescription(req.user.id, req.params.consultationId, req.body.details);
    success(res, result, 201);
  } catch (err) { error(res, err); }
};

export const list = async (req, res) => {
  try {
    const result = await prescriptionsService.getPrescriptions(req.user.id, req.params.consultationId);
    success(res, result);
  } catch (err) { error(res, err); }
};