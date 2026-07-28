import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().nonnegative('Selling price must be positive'),
  taxRate: z.coerce.number().nonnegative().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductForm = z.infer<typeof createProductSchema>;
export type UpdateProductForm = z.infer<typeof updateProductSchema>;