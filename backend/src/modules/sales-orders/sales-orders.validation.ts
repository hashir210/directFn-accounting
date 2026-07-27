import { z } from 'zod';

const salesOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  discount: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
});

export const createSalesOrderSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
    discountId: z.string().optional(),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateSalesOrderSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    items: z.array(salesOrderItemSchema).optional(),
    discountId: z.string().nullable().optional(),
    couponCode: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.string().optional(),
  }),
});

export const confirmOrderSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const invoiceOrderSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    dueDate: z.string().optional(),
  }),
});
