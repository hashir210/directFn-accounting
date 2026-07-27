import { z } from 'zod';

const salesReturnItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative(),
  reason: z.string().optional(),
});

export const createSalesReturnSchema = z.object({
  body: z.object({
    salesInvoiceId: z.string().min(1, 'Sales Invoice ID is required'),
    items: z.array(salesReturnItemSchema).min(1, 'At least one item is required'),
    reason: z.string().optional(),
  }),
});

export const processReturnSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    action: z.enum(['approve', 'reject']),
  }),
});
