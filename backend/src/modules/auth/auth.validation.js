import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  role: z.enum(['patient', 'doctor', 'admin']).optional(),
  fullName: z.string().max(255).optional(),
  phone: z.string().max(20).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});