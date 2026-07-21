import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  category: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  paymentTerms: z.string().optional(),
  dueAmount: z.number().nonnegative().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();
