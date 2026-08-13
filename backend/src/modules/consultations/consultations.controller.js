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

// NEW — patient/doctor apni consultation ki final health report fetch kar sake
export const getHealthReport = async (req, res) => {
  try {
    const result = await consultService.getHealthReport(req.user.id, req.params.id);
    success(res, result);
  } catch (err) {
    // TEMP DEBUG — Render logs mein confusion ho rahi thi, isliye error ka
    // poora detail seedha response body mein bhej rahe hain. Debugging ke
    // baad yeh block hata ke wapas `error(res, err);` kar dena.
    console.error('[REPORT DEBUG]', err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      name: err.name,
      stack: err.stack
    });
  }
};

export const getMine = async (req, res) => {
  try {
    const consultations = await consultService.getMyConsultations(req.user.id);
    success(res, consultations);
  } catch (err) { error(res, err); }
};
export const getAssigned = async (req, res) => {
  try {
    const consultations = await consultService.getAssignedConsultations(req.user.id);
    success(res, consultations);
  } catch (err) { error(res, err); }
};
export const hideConsultation = async (req, res) => {
  try {
    const result = await consultService.hideConsultation(req.user.id, req.params.id);
    success(res, result);
  } catch (err) { error(res, err); }
};