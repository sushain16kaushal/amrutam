import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  details: z.string().min(5, 'Prescription details must be at least 5 characters').max(2000)
});