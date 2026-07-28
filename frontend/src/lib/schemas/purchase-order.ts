import { z } from 'zod';

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().nonnegative('Unit price must be non-negative'),
  taxRate: z.coerce.number().nonnegative().optional(),
});

export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).optional(),
  expectedDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
});

export type CreatePurchaseOrderForm = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderForm = z.infer<typeof updatePurchaseOrderSchema>;