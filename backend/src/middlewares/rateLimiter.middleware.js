import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isDev = env.nodeEnv !== 'production';
// General API rate limit — sabhi routes ke liye baseline protection
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 200, // per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Auth routes ke liye STRICT limit — brute-force login/register attacks rokne ke liye
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,  // per IP — login/register sirf 10 baar 15 min mein
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' }
});