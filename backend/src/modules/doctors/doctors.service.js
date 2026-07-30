import * as doctorsRepo from './doctors.repository.js';
import { ApiError } from '../../utils/apiError.js';

export const registerAsDoctor = async (userId, { specialty }) => {
  const existing = await doctorsRepo.findDoctorByUserId(userId);
  if (existing) throw new ApiError(409, 'Doctor profile already exists for this user');
  if (!specialty) throw new ApiError(400, 'Specialty is required');

  return doctorsRepo.createDoctorProfile({ userId, specialty });
};

export const addAvailabilitySlot = async (userId, { startTime, endTime }) => {
  const doctor = await doctorsRepo.findDoctorByUserId(userId);
  if (!doctor) throw new ApiError(404, 'Doctor profile not found — register as doctor first');

  if (new Date(startTime) >= new Date(endTime)) {
    throw new ApiError(400, 'startTime must be before endTime');
  }
  if (new Date(startTime) < new Date()) {
    throw new ApiError(400, 'Cannot create a slot in the past');
  }

  // NEW
  const hasOverlap = await doctorsRepo.checkSlotOverlap(doctor.id, startTime, endTime);
  if (hasOverlap) {
    throw new ApiError(409, 'This slot overlaps with one of your existing slots');
  }

  // Human doctors ek time pe sirf ek patient dekh sakte hain — capacity request-body se
  // NAHI leni, hardcode karo. (AI-doctor slots alag path se, slotManager.service.js
  // ke through, apni khud ki capacity ke saath banate hain — yeh route unke liye nahi hai.)
  return doctorsRepo.createSlot({ doctorId: doctor.id, startTime, endTime, capacity: 1 });
};
export const searchDoctors = async (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10)); // max 50 per page — abuse-proofing
  const doctorKind = ['ai', 'human'].includes(query.doctorKind) ? query.doctorKind : undefined;
  const filters = {
    specialty: query.specialty,
    name: query.name,
    availableFrom: query.availableFrom,
    availableTo: query.availableTo,
    doctorKind,
    page,
    limit
  };

  const [results, total] = await Promise.all([
    doctorsRepo.searchDoctors(filters),
    doctorsRepo.countSearchResults(filters)
  ]);

  return {
    results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};
export const getDoctorAvailability = async (doctorId, query) => {
  return doctorsRepo.listSlotsByDoctor(doctorId, query);
};
export const getSpecialties = async () => {
  return doctorsRepo.listDistinctSpecialties();
};
export const getDoctorById = async (doctorId) => {
  const doctor = await doctorsRepo.findDoctorById(doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  return doctor;
};
export const getMyDoctorProfile = async (userId) => {
  return doctorsRepo.findDoctorByUserId(userId); // null aayega agar abhi register nahi kiya
};
export const listUnverifiedDoctors = async () => {
  return doctorsRepo.findUnverified();
};

export const verifyDoctor = async (doctorId) => {
  const updated = await doctorsRepo.verifyDoctorById(doctorId);
  if (!updated) throw new ApiError(404, 'Doctor not found');
  return updated;
};