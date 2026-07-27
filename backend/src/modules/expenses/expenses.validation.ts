import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '../../utils/accounting';

export const createExpenseSchema = z.object({
  body: z.object({
    vendor: z.string().min(1, 'Vendor name is required'),
    category: z.enum(EXPENSE_CATEGORIES).default('Miscellaneous'),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    date: z.string().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    vendor: z.string().min(1).optional(),
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    date: z.string().optional(),
  }),
});

export const expenseIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Expense id is required'),
  }),
});
