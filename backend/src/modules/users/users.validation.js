import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/).optional(),
  country: z.string().length(2).optional(),
  city: z.string().min(1).max(100).optional()
});