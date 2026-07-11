import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format').optional()
});