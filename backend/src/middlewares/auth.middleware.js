import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    // Temp tokens (issued mid-MFA-flow) must never be accepted as full access tokens
    if (decoded.stage === 'mfa_pending') {
      return next(new ApiError(401, 'MFA verification incomplete — please verify OTP first'));
    }

    req.user = decoded;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};