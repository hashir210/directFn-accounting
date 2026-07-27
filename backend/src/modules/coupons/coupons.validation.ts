import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').max(50),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive('Discount value must be positive'),
    minOrderAmount: z.number().nonnegative().optional(),
    maxDiscount: z.number().nonnegative().optional(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  }),
});

export const updateCouponSchema = z.object({
  body: createCouponSchema.shape.body.partial(),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required'),
    orderAmount: z.number().nonnegative().optional(),
  }),
});
