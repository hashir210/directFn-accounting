import { z } from 'zod';

const supplierReturnItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative(),
  reason: z.string().optional(),
});

export const createSupplierReturnSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1, 'Supplier ID is required'),
    purchaseOrderId: z.string().optional(),
    items: z.array(supplierReturnItemSchema).min(1, 'At least one item is required'),
    reason: z.string().optional(),
  }),
});

export const processSupplierReturnSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    action: z.enum(['ship', 'complete', 'reject']),
  }),
});
