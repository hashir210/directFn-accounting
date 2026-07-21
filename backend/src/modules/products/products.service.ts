import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class ProductsService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string; category?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.category) {
      where.category = options.category;
    }
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { sku: { contains: options.search } },
        { barcode: { contains: options.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(organizationId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, organizationId },
      include: { stockMovements: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });

    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  static async create(organizationId: string, data: {
    name: string;
    sku: string;
    barcode?: string;
    category?: string;
    unit?: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    purchasePrice?: number;
    sellingPrice: number;
    taxRate?: number;
  }) {
    const existing = await prisma.product.findFirst({
      where: { organizationId, sku: data.sku },
    });
    if (existing) throw new ConflictError('Product with this SKU already exists');

    return prisma.product.create({
      data: {
        organizationId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || null,
        category: data.category || null,
        unit: data.unit || 'Unit',
        stockQuantity: data.stockQuantity || 0,
        lowStockThreshold: data.lowStockThreshold || 10,
        purchasePrice: data.purchasePrice !== undefined ? new Decimal(data.purchasePrice) : 0,
        sellingPrice: new Decimal(data.sellingPrice),
        taxRate: data.taxRate !== undefined ? new Decimal(data.taxRate) : 0,
      },
    });
  }

  static async update(organizationId: string, id: string, data: Partial<{
    name: string;
    sku: string;
    barcode: string;
    category: string;
    unit: string;
    stockQuantity: number;
    lowStockThreshold: number;
    purchasePrice: number;
    sellingPrice: number;
    taxRate: number;
  }>) {
    await this.getById(organizationId, id);

    const updateData: any = { ...data };
    if (data.purchasePrice !== undefined) updateData.purchasePrice = new Decimal(data.purchasePrice);
    if (data.sellingPrice !== undefined) updateData.sellingPrice = new Decimal(data.sellingPrice);
    if (data.taxRate !== undefined) updateData.taxRate = new Decimal(data.taxRate);

    return prisma.product.update({ where: { id }, data: updateData });
  }

  static async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    return prisma.product.delete({ where: { id } });
  }
}
