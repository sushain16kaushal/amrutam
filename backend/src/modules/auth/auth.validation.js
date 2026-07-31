import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(10),
  role: z.enum(['patient', 'doctor']).optional()
});
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  role: z.enum(['patient', 'doctor']).optional(),
  fullName: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  country: z.string().length(2, 'Use ISO2 country code'),   // NEW — required
  city: z.string().min(1).max(100) 
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
});
export const disableMfaSchema = z.object({
  password: z.string().min(1)
});
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});
export const disableMfaOtpSchema = z.object({
  otp: z.string().length(6)
});