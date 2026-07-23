import prisma from '../../config/db';
import { NotFoundError } from '../../utils/errors';

export class InventoryService {
  static async listWarehouses(organizationId: string) {
    let warehouses = await prisma.warehouse.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });

    if (warehouses.length === 0) {
      // Auto-create default HQ warehouse
      const defaultWh = await prisma.warehouse.create({
        data: {
          organizationId,
          name: 'Main HQ Warehouse',
          code: 'HQ-01',
          isDefault: true,
        },
      });
      warehouses = [defaultWh];
    }

    return warehouses;
  }

  static async createWarehouse(organizationId: string, data: { name: string; code?: string; address?: string; isDefault?: boolean }) {
    if (data.isDefault) {
      await prisma.warehouse.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }

    return prisma.warehouse.create({
      data: {
        organizationId,
        name: data.name,
        code: data.code || null,
        address: data.address || null,
        isDefault: data.isDefault || false,
      },
    });
  }

  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string; type?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.type) {
      where.type = options.type;
    }
    if (options.search) {
      where.OR = [
        { itemName: { contains: options.search } },
        { sku: { contains: options.search } },
        { warehouse: { contains: options.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
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

  static async updateMovement(organizationId: string, id: string, data: {
    type?: 'Stock In' | 'Stock Out' | 'Transfer' | 'Damaged' | 'Adjustment';
    sku?: string;
    itemName?: string;
    quantity?: number;
    warehouse?: string;
    warehouseId?: string;
  }) {
    const existing = await prisma.stockMovement.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundError('Stock movement not found');

    return prisma.stockMovement.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.sku && { sku: data.sku }),
        ...(data.itemName && { itemName: data.itemName }),
        ...(data.quantity && { quantity: data.quantity }),
        ...(data.warehouse && { warehouse: data.warehouse }),
        ...(data.warehouseId !== undefined && { warehouseId: data.warehouseId }),
      },
    });
  }

  static async deleteMovement(organizationId: string, id: string) {
    const existing = await prisma.stockMovement.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundError('Stock movement not found');

    return prisma.stockMovement.delete({ where: { id } });
  }

  static async recordMovement(organizationId: string, data: {
    type: 'Stock In' | 'Stock Out' | 'Transfer' | 'Damaged' | 'Adjustment';
    sku: string;
    itemName: string;
    quantity: number;
    warehouse?: string;
    warehouseId?: string;
  }) {
    const product = await prisma.product.findFirst({
      where: { organizationId, sku: data.sku },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        organizationId,
        type: data.type,
        productId: product ? product.id : null,
        sku: data.sku,
        itemName: data.itemName,
        quantity: data.quantity,
        warehouse: data.warehouse || 'Main HQ Warehouse',
        warehouseId: data.warehouseId || null,
        status: 'Completed',
      },
    });

    if (product) {
      let stockChange = 0;
      if (data.type === 'Stock In' || data.type === 'Adjustment') {
        stockChange = data.quantity;
      } else if (data.type === 'Stock Out' || data.type === 'Damaged') {
        stockChange = -data.quantity;
      }

      if (stockChange !== 0) {
        const updatedProduct = await prisma.product.update({
          where: { id: product.id },
          data: { stockQuantity: { increment: stockChange } },
        });

        // Trigger notification if low stock threshold is reached
        if (updatedProduct.stockQuantity <= updatedProduct.lowStockThreshold) {
          const owner = await prisma.user.findFirst({ where: { organizationId } });
          if (owner) {
            await prisma.notification.create({
              data: {
                organizationId,
                userId: owner.id,
                title: 'Low Stock Alert',
                message: `Product ${updatedProduct.name} (${updatedProduct.sku}) stock dropped to ${updatedProduct.stockQuantity} units!`,
                type: 'warning',
              },
            });
          }
        }
      }
    }

    return movement;
  }
}

