import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['PRODUCT', 'EXPENSE', 'INCOME', 'SUPPLIER']),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().optional(),
    type: z.enum(['PRODUCT', 'EXPENSE', 'INCOME', 'SUPPLIER']).optional(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});
