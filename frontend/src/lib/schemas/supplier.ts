import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  category: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  paymentTerms: z.string().optional(),
  dueAmount: z.coerce.number().nonnegative().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierForm = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierForm = z.infer<typeof updateSupplierSchema>;