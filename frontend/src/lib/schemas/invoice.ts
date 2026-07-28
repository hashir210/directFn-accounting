import { z } from 'zod';

export const lineItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().nonnegative().default(0),
});

export type LineItem = z.infer<typeof lineItemSchema>;

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

export type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>;