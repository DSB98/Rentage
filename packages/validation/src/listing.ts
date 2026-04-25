import { z } from 'zod';

export const createListingSchema = z.object({
  categoryId: z.string().uuid('Invalid category'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  price: z.number().positive('Price must be positive').max(10000000),
  rentPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  address: z.string().max(500).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenities: z
    .array(
      z.object({
        key: z.string().min(1).max(50),
        value: z.string().min(1).max(200),
      }),
    )
    .max(30)
    .optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const searchListingsSchema = z.object({
  query: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rentPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional().default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;
