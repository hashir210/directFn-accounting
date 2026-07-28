import { z } from 'zod';

export const INCOME_CATEGORIES = ['Sales', 'Services', 'Investment', 'Other Income'] as const;

export const createIncomeSchema = z.object({
  category: z.enum(INCOME_CATEGORIES).default('Sales'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().optional(),
  referenceNo: z.string().optional(),
});

export const updateIncomeSchema = z.object({
  category: z.enum(INCOME_CATEGORIES).optional(),
  description: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  date: z.string().optional(),
  referenceNo: z.string().optional(),
});

export type CreateIncomeForm = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeForm = z.infer<typeof updateIncomeSchema>;