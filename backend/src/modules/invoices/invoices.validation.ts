import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    dueAt: z.string().optional(),
    status: z.enum(['pending', 'paid', 'overdue']).optional().default('pending'),
    notes: z.string().optional(),
    terms: z.string().optional(),
    items: z.array(z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().nonnegative().default(0),
    })).min(1, 'At least one line item is required'),
  }).refine((data) => data.customerId || data.customerName, {
    message: "Either customerId or customerName is required",
    path: ["customerId"],
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'paid', 'overdue']).optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
  }),
});

export const invoiceIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invoice id is required'),
  }),
});

export const payInvoiceSchema = z.object({
  body: z.object({
    amount: z.number().positive('Payment amount must be positive').optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Invoice id is required'),
  }),
});

export const emailInvoiceSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required').optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Invoice id is required'),
  }),
});
