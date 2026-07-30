import { z } from 'zod';

export const registerDoctorSchema = z.object({
  specialty: z.string().min(2, 'Specialty must be at least 2 characters').max(100)
});

export const addSlotSchema = z.object({
  startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime' }),
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }),
  capacity: z.number().int().min(1).max(50).optional().default(3), // ek slot mein max 50 patients tak allow, default 3
}).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
  message: 'startTime must be before endTime',
  path: ['startTime']
});