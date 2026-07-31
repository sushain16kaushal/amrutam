import { z } from 'zod';

export const unlockChatSchema = z.object({
  pin: z.string().min(1, 'PIN is required')
});