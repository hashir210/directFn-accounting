import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    creditLimit: z.number().optional(),
    status: z.string().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: createCustomerSchema.shape.body.partial(),
});

