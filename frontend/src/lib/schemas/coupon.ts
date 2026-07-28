import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Discount value must be positive'),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().nonnegative().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export const updateCouponSchema = createCouponSchema.partial();

export type CreateCouponForm = z.infer<typeof createCouponSchema>;
export type UpdateCouponForm = z.infer<typeof updateCouponSchema>;