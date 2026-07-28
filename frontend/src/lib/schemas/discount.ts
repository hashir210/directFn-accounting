import { z } from 'zod';

export const createDiscountSchema = z.object({
  name: z.string().min(1, 'Discount name is required'),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive('Value must be positive'),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateDiscountSchema = createDiscountSchema.partial();

export type CreateDiscountForm = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountForm = z.infer<typeof updateDiscountSchema>;