import { z } from 'zod';

export const createTaxSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    rate: z.number().min(0, 'Rate must be positive'),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateTaxSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    rate: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const taxIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});
