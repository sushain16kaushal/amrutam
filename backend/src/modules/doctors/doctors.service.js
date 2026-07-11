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

  return doctorsRepo.createSlot({ doctorId: doctor.id, startTime, endTime });
};
export const searchDoctors = async (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10)); // max 50 per page — abuse-proofing

  const filters = {
    specialty: query.specialty,
    name: query.name,
    availableFrom: query.availableFrom,
    availableTo: query.availableTo,
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