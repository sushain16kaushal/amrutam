import * as usersService from './users.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const getProfile = async (req, res) => {
  try {
    const profile = await usersService.getMyProfile(req.user.id);
    success(res, profile);
  } catch (err) { error(res, err); }
};

export const updateProfile = async (req, res) => {
  try {
    const profile = await usersService.updateMyProfile(req.user.id, req.body);
    success(res, profile);
  } catch (err) { error(res, err); }
};