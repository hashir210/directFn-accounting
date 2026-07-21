import prisma from '../../config/db';

export class InventoryService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string; type?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
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

  static async recordMovement(organizationId: string, data: {
    type: 'Stock In' | 'Stock Out' | 'Transfer' | 'Damaged' | 'Adjustment';
    sku: string;
    itemName: string;
    quantity: number;
    warehouse?: string;
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
        warehouse: data.warehouse || 'Main Warehouse',
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
        await prisma.product.update({
          where: { id: product.id },
          data: { stockQuantity: { increment: stockChange } },
        });
      }
    }

    return movement;
  }
}
