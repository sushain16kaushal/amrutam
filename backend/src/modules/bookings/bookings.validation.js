import { z } from 'zod';

export const bookSlotSchema = z.object({
  slotId: z.string().uuid('slotId must be a valid UUID'),
  simulateFailure: z.boolean().optional()
});