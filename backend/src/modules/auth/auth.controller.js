import * as authService from './auth.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    success(res, user, 201);
  } catch (err) { error(res, err); }
};

export const login = async (req, res) => {
  try {
    const result = await authService.loginStep1(req.body);
    success(res, result);
  } catch (err) { error(res, err); }
};

export const verifyMfa = async (req, res) => {
  try {
    const result = await authService.verifyMfaAndLogin(req.body);
    success(res, result);
  } catch (err) { error(res, err); }
};

export const enableMfa = async (req, res) => {
  try {
    const result = await authService.setupMfa(req.user.id); // req.user auth middleware se aayega
    success(res, result);
  } catch (err) { error(res, err); }
};