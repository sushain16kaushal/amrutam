import * as refundsService from './refunds.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const requestRefund = async (req, res) => {
  try {
    const request = await refundsService.requestRefund(req.user.id, req.params.consultationId, req.body);
    success(res, request, 201);
  } catch (err) { error(res, err); }
};

export const getPending = async (req, res) => {
  try {
    const requests = await refundsService.getPendingRequests();
    success(res, requests);
  } catch (err) { error(res, err); }
};

export const getMine = async (req, res) => {
  try {
    const requests = await refundsService.getMyRequests(req.user.id);
    success(res, requests);
  } catch (err) { error(res, err); }
};

export const approve = async (req, res) => {
  try {
    const updated = await refundsService.approveRequest(req.user.id, req.params.id);
    success(res, updated);
  } catch (err) { error(res, err); }
};

export const reject = async (req, res) => {
  try {
    const updated = await refundsService.rejectRequest(req.user.id, req.params.id, req.body.adminMessage);
    success(res, updated);
  } catch (err) { error(res, err); }
};