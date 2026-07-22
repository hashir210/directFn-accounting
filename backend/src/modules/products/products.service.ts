import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class ProductsService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string; category?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
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

    const formattedItems = items.map((product) => {
      let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
      if (product.stockQuantity <= 0) {
        status = 'Out of Stock';
      } else if (product.stockQuantity <= product.lowStockThreshold) {
        status = 'Low Stock';
      }

      return {
        ...product,
        status,
        purchasePrice: Number(product.purchasePrice).toFixed(2),
        sellingPrice: Number(product.sellingPrice).toFixed(2),
        taxRate: Number(product.taxRate).toFixed(2),
      };
    });

    return {
      items: formattedItems,
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

    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (product.stockQuantity <= 0) {
      status = 'Out of Stock';
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      status = 'Low Stock';
    }

    return {
      ...product,
      status,
      purchasePrice: Number(product.purchasePrice).toFixed(2),
      sellingPrice: Number(product.sellingPrice).toFixed(2),
      taxRate: Number(product.taxRate).toFixed(2),
    };
  }

  static async create(organizationId: string, data: {
    name: string;
    sku: string;
    barcode?: string;
    category?: string;
    unit?: string;
    imageUrl?: string;
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
        imageUrl: data.imageUrl || null,
        stockQuantity: data.stockQuantity || 0,
        lowStockThreshold: data.lowStockThreshold || 10,
        purchasePrice: data.purchasePrice !== undefined ? new Decimal(data.purchasePrice) : new Decimal(0),
        sellingPrice: new Decimal(data.sellingPrice),
        taxRate: data.taxRate !== undefined ? new Decimal(data.taxRate) : new Decimal(0),
      },
    });
  }

  static async update(organizationId: string, id: string, data: Partial<{
    name: string;
    sku: string;
    barcode: string;
    category: string;
    unit: string;
    imageUrl: string;
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

