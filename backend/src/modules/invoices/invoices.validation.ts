import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    customerEmail: z.string().email().optional().or(z.literal('')),
    amount: z.number().positive('Amount must be positive'),
    dueAt: z.string().optional(),
    status: z.enum(['pending', 'paid', 'overdue']).optional().default('pending'),
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    customerName: z.string().min(1).optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    amount: z.number().positive().optional(),
    dueAt: z.string().optional(),
    status: z.enum(['pending', 'paid', 'overdue']).optional(),
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
