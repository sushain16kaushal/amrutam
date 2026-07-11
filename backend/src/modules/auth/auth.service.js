import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { logAction } from '../../utils/auditLogger.js';
import { encrypt, decrypt } from '../../utils/encryption.js';
import * as authRepo from './auth.repository.js';
import * as usersRepo from '../users/users.repository.js';
export const registerUser = async ({ email, password, role = 'patient', fullName, phone }) => {
  const existing = await authRepo.findUserByEmail(email);
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await authRepo.createUser({ email, passwordHash, role });
  await usersRepo.createProfile({ userId: user.id, fullName, phone }); // NEW LINE

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

  if (user.mfa_enabled) {
    // Password sahi hai, lekin abhi poora access token nahi denge
    const tempToken = jwt.sign(
      { id: user.id, stage: 'mfa_pending' },
      env.jwtSecret,
      { expiresIn: env.mfaTempTokenExpiry }
    );
    return { mfaRequired: true, tempToken };
  }
 await logAction({ actorId: user.id, action: 'login_success', metadata: {} });
  const accessToken = generateAccessToken(user);
  return { mfaRequired: false, accessToken };
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
  await logAction({ actorId: user.id, action: 'login_success', metadata: { via: 'mfa' } });
  return { accessToken: generateAccessToken(user) };
};

export const setupMfa = async (userId) => {
  const secret = speakeasy.generateSecret({ name: `Amrutam (${userId})` });
  await authRepo.setMfaSecret(userId, encrypt(secret.base32)); // NEW — encrypt karke store
  return { otpauthUrl: secret.otpauth_url };
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiry }
  );
};