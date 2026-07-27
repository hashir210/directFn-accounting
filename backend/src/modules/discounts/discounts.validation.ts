import { z } from 'zod';

export const createDiscountSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Discount name is required'),
    type: z.enum(['percentage', 'fixed']),
    value: z.number().positive('Value must be positive'),
    minOrderAmount: z.number().nonnegative().optional(),
    maxDiscount: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const updateDiscountSchema = z.object({
  body: createDiscountSchema.shape.body.partial(),
});
