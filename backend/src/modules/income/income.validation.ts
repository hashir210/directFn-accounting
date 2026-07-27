import { z } from 'zod';
import { INCOME_CATEGORIES } from '../../utils/accounting';

export const createIncomeSchema = z.object({
  body: z.object({
    category: z.enum(INCOME_CATEGORIES).default('Sales'),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    date: z.string().optional(),
    referenceNo: z.string().optional(),
  }),
});

export const updateIncomeSchema = z.object({
  body: z.object({
    category: z.enum(INCOME_CATEGORIES).optional(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    date: z.string().optional(),
    referenceNo: z.string().optional(),
  }),
});

export const incomeIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Income id is required'),
  }),
});
