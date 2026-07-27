import { z } from 'zod';

const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  taxRate: z.number().nonnegative().optional(),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1, 'Supplier ID is required'),
    items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
    expectedDate: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updatePurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().optional(),
    items: z.array(purchaseOrderItemSchema).optional(),
    expectedDate: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.string().optional(),
  }),
});

export const receiveGoodsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    items: z.array(z.object({
      productId: z.string().min(1),
      orderedQty: z.number().int().nonnegative(),
      receivedQty: z.number().int().nonnegative(),
      acceptedQty: z.number().int().nonnegative(),
      rejectedQty: z.number().int().nonnegative().optional(),
    })).min(1, 'At least one item is required'),
    notes: z.string().optional(),
  }),
});

export const createInvoiceFromPOSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    dueDate: z.string().min(1, 'Due date is required'),
  }),
});
