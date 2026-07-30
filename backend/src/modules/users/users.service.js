import * as usersRepo from './users.repository.js';
import { ApiError } from '../../utils/apiError.js';
import { geocodeCityCountry } from '../../utils/geocode.js';
export const updateMyProfile = async (userId, data) => {
  let coords = {};
  if (data.country && data.city) {
    try {
      const geo = await geocodeCityCountry(data.city, data.country);
      if (geo) coords = geo;
    } catch {
      // geocode-fail se profile-save block nahi hona chahiye — non-blocking
    }
  }
  const updated = await usersRepo.updateProfile(userId, { ...data, ...coords });
  if (!updated) throw new ApiError(404, 'Profile not found for this user');
  return updated;
};

export const getMyProfile = async (userId) => {
  const profile = await usersRepo.findProfileWithUserByUserId(userId);
  if (!profile) throw new ApiError(404, 'Profile not found');
  return profile;
};