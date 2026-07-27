import { z } from 'zod';
import { ACCOUNT_TYPES } from '../../utils/accounting';

export const createAccountSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Account code is required'),
    name: z.string().min(1, 'Account name is required'),
    type: z.enum(ACCOUNT_TYPES),
    parentId: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateAccountSchema = z.object({
  body: z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    type: z.enum(ACCOUNT_TYPES).optional(),
    parentId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const accountIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Account id is required'),
  }),
});
