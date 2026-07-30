import { z } from 'zod';

export const createBankAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    balance: z.number().optional().default(0),
    currency: z.string().optional().default('USD'),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateBankAccountSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    balance: z.number().optional(),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const bankAccountIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});
