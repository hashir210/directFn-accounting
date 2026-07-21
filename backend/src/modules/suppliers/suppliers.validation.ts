import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Supplier name is required'),
    category: z.string().optional(),
    contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    paymentTerms: z.string().optional(),
    dueAmount: z.number().nonnegative().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: createSupplierSchema.shape.body.partial(),
});
