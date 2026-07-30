import { z } from 'zod';

export const createRefundSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason (min 10 characters)').max(1000)
});

export const rejectRefundSchema = z.object({
  adminMessage: z.string().min(5, 'Please provide a reason for rejection').max(1000)
});