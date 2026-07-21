import { z } from 'zod';

export const recordMovementSchema = z.object({
  body: z.object({
    type: z.enum(['Stock In', 'Stock Out', 'Transfer', 'Damaged', 'Adjustment']),
    sku: z.string().min(1, 'SKU is required'),
    itemName: z.string().min(1, 'Item name is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    warehouse: z.string().optional(),
  }),
});
