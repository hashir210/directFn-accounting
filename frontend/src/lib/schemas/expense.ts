import { z } from 'zod';

export const EXPENSE_CATEGORIES = ['Office', 'Salary', 'Utilities', 'Fuel', 'Internet', 'Miscellaneous'] as const;

export const createExpenseSchema = z.object({
  vendor: z.string().min(1, 'Vendor name is required'),
  category: z.enum(EXPENSE_CATEGORIES).default('Miscellaneous'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  vendor: z.string().min(1).optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  description: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  date: z.string().optional(),
});

export type CreateExpenseForm = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseForm = z.infer<typeof updateExpenseSchema>;