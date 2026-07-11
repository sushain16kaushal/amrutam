import * as usersRepo from './users.repository.js';
import { ApiError } from '../../utils/apiError.js';

export const getMyProfile = async (userId) => {
  const profile = await usersRepo.findProfileByUserId(userId);
  if (!profile) throw new ApiError(404, 'Profile not found');
  return profile;
};
// modules/users/users.service.js
export const updateMyProfile = async (userId, data) => {
  const updated = await usersRepo.updateProfile(userId, data);
  if (!updated) throw new ApiError(404, 'Profile not found for this user');
  return updated;
};