import * as doctorsService from './doctors.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const registerDoctor = async (req, res) => {
  try {
    const doctor = await doctorsService.registerAsDoctor(req.user.id, req.body);
    success(res, doctor, 201);
  } catch (err) { error(res, err); }
};

export const addSlot = async (req, res) => {
  try {
    const slot = await doctorsService.addAvailabilitySlot(req.user.id, req.body);
    success(res, slot, 201);
  } catch (err) { error(res, err); }
};

export const getAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const slots = await doctorsService.getDoctorAvailability(doctorId, req.query);
    success(res, slots);
  } catch (err) { error(res, err); }
};
export const search = async (req, res) => {
  try {
    const result = await doctorsService.searchDoctors(req.query);
    success(res, result);
  } catch (err) { error(res, err); }
};