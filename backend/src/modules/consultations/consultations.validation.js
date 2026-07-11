import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled'], {
    message: 'status must be one of: in_progress, completed, cancelled'
  })
});