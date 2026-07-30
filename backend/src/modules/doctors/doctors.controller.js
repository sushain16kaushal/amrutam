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
export const getSpecialties = async (req, res) => {
  try {
    const specialties = await doctorsService.getSpecialties();
    success(res, specialties);
  } catch (err) { error(res, err); }
};
export const getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await doctorsService.getDoctorById(doctorId);
    success(res, doctor);
  } catch (err) { error(res, err); }
};
export const getMyProfile = async (req, res) => {
  try {
    const profile = await doctorsService.getMyDoctorProfile(req.user.id);
    success(res, profile); // null bhi valid response hai — "not registered yet" ka signal
  } catch (err) { error(res, err); }
};
export const listUnverified = async (req, res) => {
  try {
    const doctors = await doctorsService.listUnverifiedDoctors();
    success(res, doctors);
  } catch (err) { error(res, err); }
};

export const verify = async (req, res) => {
  try {
    const updated = await doctorsService.verifyDoctor(req.params.doctorId);
    success(res, updated);
  } catch (err) { error(res, err); }
};