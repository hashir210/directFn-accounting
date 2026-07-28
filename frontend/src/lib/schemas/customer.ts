import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.coerce.number().optional(),
  status: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerForm = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerForm = z.infer<typeof updateCustomerSchema>;