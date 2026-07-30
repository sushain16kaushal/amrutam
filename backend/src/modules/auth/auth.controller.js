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
// controller
export const forgotPassword = async (req, res) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    success(res, { message: 'If that email exists, a code has been sent.' });
  } catch (err) { error(res, err); }
};

export const resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
    success(res, { message: 'Password reset successfully.' });
  } catch (err) { error(res, err); }
};
export const disableMfa = async (req, res) => {
  try {
    await authService.disableMfa(req.user.id, req.body.password);
    success(res, { message: 'MFA disabled successfully.' });
  } catch (err) { error(res, err); }
};
export const refresh = async (req, res) => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    success(res, result);
  } catch (err) { error(res, err); }
};
export const googleLogin = async (req, res) => {
  try {
    const result = await authService.loginWithGoogle(req.body);
    success(res, result);
  } catch (err) { error(res, err); }
};
export const requestDisableMfaOtp = async (req, res) => {
  try {
    await authService.requestDisableMfaOtp(req.user.id);
    success(res, { message: 'OTP sent to your email.' });
  } catch (err) { error(res, err); }
};

export const disableMfaWithOtp = async (req, res) => {
  try {
    await authService.disableMfaWithOtp(req.user.id, req.body.otp);
    success(res, { message: 'MFA disabled successfully.' });
  } catch (err) { error(res, err); }
};