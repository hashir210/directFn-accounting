import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().min(1, 'SKU is required'),
    barcode: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    purchasePrice: z.number().nonnegative().optional(),
    sellingPrice: z.number().nonnegative('Selling price must be positive'),
    taxRate: z.number().nonnegative().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
});
