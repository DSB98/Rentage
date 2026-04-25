import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+91[0-9]{10}$/, 'Invalid Indian phone number')
    .optional()
    .nullable(),
  bio: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
