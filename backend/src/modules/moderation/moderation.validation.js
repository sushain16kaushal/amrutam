import { z } from 'zod';

export const resolveCaseSchema = z.object({
  action: z.enum(['temp_ban', 'permanent_ban', 'uplift', 'dismissed', 'flagged_for_prompt_review']),
  banDays: z.number().int().positive().optional()
});