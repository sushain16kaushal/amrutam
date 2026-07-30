import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { env } from '../../config/env.js';
import { sendOtpEmail } from '../../utils/email.js';
import redis from '../../config/redis.js';
import { ApiError } from '../../utils/apiError.js';
import { logAction } from '../../utils/auditLogger.js';
import { encrypt, decrypt } from '../../utils/encryption.js';
import * as authRepo from './auth.repository.js';
import { OAuth2Client } from 'google-auth-library';
import * as usersRepo from '../users/users.repository.js';
import * as doctorsRepo from '../doctors/doctors.repository.js';
import {geocodeCityCountry} from '../../utils/geocode.js';
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; 
const googleClient = new OAuth2Client(env.googleClientId);
const enforceBanCheck = async (user) => {
  if (user.ban_status === 'permanently_banned') {
    throw new ApiError(403, `Your account has been permanently banned. Reason: ${user.ban_reason || 'Policy violation'}`);
  }
  if (user.ban_status === 'temp_banned') {
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      throw new ApiError(403, `Your account is banned until ${new Date(user.banned_until).toLocaleString()}. Reason: ${user.ban_reason || 'Policy violation'}`);
    }
    // Ban-period khatam ho chuka — silently clear kar do, login normally-proceed karega
    await authRepo.clearExpiredBan(user.id);
  }
};
export const requestPasswordReset = async (email) => {
  const user = await authRepo.findUserByEmail(email);
  // Security: user exist na kare tab bhi same success message do — email enumeration attack se bachne ke liye
  if (!user) return { success: true };

  const otp = generateOtp();
  await redis.set(`pwreset:${email}`, otp, 'EX', 600); // 10 minute TTL
  await sendOtpEmail(email, otp);
  return { success: true };
};

export const resetPassword = async (email, otp, newPassword) => {
  const storedOtp = await redis.get(`pwreset:${email}`);
  if (!storedOtp || storedOtp !== otp) {
    throw new ApiError(400, 'Invalid or expired code');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await authRepo.updatePasswordByEmail(email, passwordHash);
  await redis.del(`pwreset:${email}`); // ek baar use hone ke baad OTP turant invalidate

  await logAction({ actorId: null, action: 'password_reset', metadata: { email } });
};


export const registerUser = async ({ email, password, role = 'patient', fullName, phone, country, city }) => {
  const existing = await authRepo.findUserByEmail(email);
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await authRepo.createUser({ email, passwordHash, role });
    let coords = {};
  try {
    const geo = await geocodeCityCountry(city, country);
    if (geo) coords = geo;
  } catch {
    // non-blocking
  }
  await usersRepo.createProfile({ userId: user.id, fullName, phone, country, city, ...coords });

  return { id: user.id, email: user.email, role: user.role };
};

export const loginStep1 = async ({ email, password }) => {
  const user = await authRepo.findUserByEmail(email);
  if (!user) 
    { 
       await logAction({ actorId: null, action: 'login_failed', metadata: { email, reason: 'user_not_found' } });
      throw new ApiError(401, 'Invalid credentials');
    }
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch){ 
     await logAction({ actorId: user.id, action: 'login_failed', metadata: { reason: 'wrong_password' } });
    throw new ApiError(401, 'Invalid credentials');
  }
await enforceBanCheck(user); // NEW
  if (user.mfa_enabled) {
    // Password sahi hai, lekin abhi poora access token nahi denge
    const tempToken = jwt.sign(
      { id: user.id, stage: 'mfa_pending' },
      env.jwtSecret,
      { expiresIn: env.mfaTempTokenExpiry }
    );
    return { mfaRequired: true, tempToken };
  }

  return await issueTokens(user);
};
export const loginWithGoogle = async ({ idToken, role = 'patient' }) => {
  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name } = payload;

  let user = await authRepo.findUserByGoogleId(googleId);

  if (!user) {
    const existingByEmail = await authRepo.findUserByEmail(email);
    if (existingByEmail) {
      // Same email se pehle local-signup tha — accounts link karo, duplicate mat banao
      user = await authRepo.linkGoogleId(existingByEmail.id, googleId);
    } else {
      if (!['patient', 'doctor'].includes(role)) {
        throw new ApiError(400, 'Invalid role for Google sign-up');
      }
      user = await authRepo.createGoogleUser({ email, googleId, role });
      await usersRepo.createProfile({ userId: user.id, fullName: name }); // country/city NULL rahega
    }
  }
await enforceBanCheck(user);
  if (user.mfa_enabled) {
    const tempToken = jwt.sign(
      { id: user.id, stage: 'mfa_pending' },
      env.jwtSecret,
      { expiresIn: env.mfaTempTokenExpiry }
    );
    return { mfaRequired: true, tempToken };
  }

  return await issueTokens(user);
};

export const verifyMfaAndLogin = async ({ tempToken, otpCode }) => {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Temp token expired, login again');
  }
  if (decoded.stage !== 'mfa_pending') throw new ApiError(401, 'Invalid token stage');

  const user = await authRepo.findUserById(decoded.id);
  const decryptedSecret = decrypt(user.mfa_secret); // NEW — decrypt karke verify karo
  const isValid = speakeasy.totp.verify({ secret: decryptedSecret, encoding: 'base32', token: otpCode, window: 1 });
  if (!isValid) {
    await logAction({ actorId: user.id, action: 'mfa_failed', metadata: {} });
    throw new ApiError(401, 'Invalid OTP');
  }

  return await issueTokens(user);
};

export const setupMfa = async (userId) => {
  const secret = speakeasy.generateSecret({ name: `Amrutam (${userId})` });
  await authRepo.setMfaSecret(userId, encrypt(secret.base32)); // NEW — encrypt karke store
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url); 
  return { otpauthUrl: secret.otpauth_url, qrCodeDataUrl };
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiry }
  );
};
const issueTokens = async (user) => {
  await logAction({ actorId: user.id, action: 'login_success', metadata: {} });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);

  const locationComplete = await usersRepo.isProfileComplete(user.id);
  let profileComplete = locationComplete;

  if (user.role === 'doctor') {
    const doctorProfile = await doctorsRepo.findDoctorByUserId(user.id);
    profileComplete = locationComplete && !!doctorProfile; // dono chahiye — location AND specialty
  }

  return { mfaRequired: false, accessToken, refreshToken, profileComplete, role: user.role };
};
export const disableMfa = async (userId, password) => {
  const user = await authRepo.findUserById(userId);
  if (!user.mfa_enabled) {
    throw new ApiError(400, 'MFA is not enabled on your account.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Incorrect password.');
  }

  await authRepo.clearMfaSecret(userId);
};
export const requestDisableMfaOtp = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user.mfa_enabled) {
    throw new ApiError(400, 'MFA is not enabled on your account.');
  }
  const otp = generateOtp();
  await redis.set(`disablemfa:${userId}`, otp, 'EX', 600); // 10 minute TTL, password-reset jaisa
  await sendOtpEmail(user.email, otp);
  return { success: true };
};

export const disableMfaWithOtp = async (userId, otp) => {
  const user = await authRepo.findUserById(userId);
  if (!user.mfa_enabled) {
    throw new ApiError(400, 'MFA is not enabled on your account.');
  }
  const storedOtp = await redis.get(`disablemfa:${userId}`);
  if (!storedOtp || storedOtp !== otp) {
    throw new ApiError(400, 'Invalid or expired code');
  }
  await authRepo.clearMfaSecret(userId);
  await redis.del(`disablemfa:${userId}`);
  await logAction({ actorId: userId, action: 'mfa_disabled', metadata: { via: 'email_otp' } });
};
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiry });
};

const storeRefreshToken = async (userId, refreshToken) => {
  // Redis mein latest refresh token rakhte hain — jab bhi rotate ho, purana automatically invalid
  await redis.set(`refresh:${userId}`, refreshToken, 'EX', REFRESH_TOKEN_TTL_SECONDS);
};

export const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token — please login again');
  }

  const storedToken = await redis.get(`refresh:${decoded.id}`);
  if (!storedToken || storedToken !== refreshToken) {
    // Yeh token ya toh already rotate ho chuka hai (purana/reused — possible theft attempt),
    // ya user logout kar chuka hai. Dono case reject karo.
    throw new ApiError(401, 'Refresh token is no longer valid — please login again');
  }

  const user = await authRepo.findUserById(decoded.id);
  if (!user) throw new ApiError(401, 'User not found');

  // Rotation: naya access token AUR naya refresh token dono issue — purana turant dead
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
