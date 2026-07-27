import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class SupplierReturnsService {
  static async list(organizationId: string, options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const where: any = org?.isPlatform ? {} : { organizationId };
    if (options.status && options.status !== 'all') where.status = options.status;

    const [items, total] = await Promise.all([
      prisma.supplierReturn.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, orderNo: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supplierReturn.count({ where }),
    ]);

    return {
      items: items.map(r => ({
        ...r,
        totalAmount: toNum(r.totalAmount),
        items: r.items.map(i => ({ ...i, unitPrice: toNum(i.unitPrice), lineTotal: toNum(i.lineTotal) })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(organizationId: string, id: string) {
    const ret = await prisma.supplierReturn.findFirst({
      where: { id, organizationId },
      include: { supplier: true, purchaseOrder: true, items: { include: { product: true } } },
    });
    if (!ret) throw new NotFoundError('Supplier return not found');
    return { ...ret, totalAmount: toNum(ret.totalAmount), items: ret.items.map(i => ({ ...i, unitPrice: toNum(i.unitPrice), lineTotal: toNum(i.lineTotal) })) };
  }

  static async create(organizationId: string, data: {
    supplierId: string;
    purchaseOrderId?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; reason?: string }>;
    reason?: string;
  }) {
    const supplier = await prisma.supplier.findFirst({ where: { id: data.supplierId, organizationId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    let totalAmount = 0;
    const lineItems = data.items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      totalAmount += lineTotal;
      return { productId: item.productId, quantity: item.quantity, unitPrice: new Decimal(item.unitPrice), lineTotal: new Decimal(lineTotal), reason: item.reason || null };
    });

    const count = await prisma.supplierReturn.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const returnNo = `SPR-${year}-${String(count + 1).padStart(4, '0')}`;

    return prisma.supplierReturn.create({
      data: {
        organizationId,
        returnNo,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId || null,
        totalAmount: new Decimal(totalAmount),
        reason: data.reason || null,
        status: 'Pending',
        items: { create: lineItems },
      },
      include: { supplier: { select: { id: true, name: true } }, items: true },
    });
  }

  static async process(organizationId: string, id: string, action: 'ship' | 'complete' | 'reject') {
    const ret = await prisma.supplierReturn.findFirst({ where: { id, organizationId }, include: { items: true } });
    if (!ret) throw new NotFoundError('Supplier return not found');

    const statusMap: Record<string, string[]> = {
      ship: ['Pending'],
      complete: ['Shipped'],
      reject: ['Pending', 'Shipped'],
    };
    if (!statusMap[action].includes(ret.status)) throw new BadRequestError(`Cannot ${action} a return with status ${ret.status}`);

    const newStatus = action === 'ship' ? 'Shipped' : action === 'complete' ? 'Completed' : 'Rejected';

    if (action === 'complete') {
      // Deduct stock for returned items
      for (const item of ret.items) {
        await prisma.product.update({ where: { id: item.productId }, data: { stockQuantity: { decrement: item.quantity } } });
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          await prisma.stockMovement.create({
            data: { organizationId, type: 'Stock Out', productId: item.productId, sku: product.sku, itemName: product.name, quantity: item.quantity, warehouse: 'Main Warehouse', status: 'Completed' },
          });
        }
      }
      // Reduce supplier due amount
      await prisma.supplier.update({
        where: { id: ret.supplierId },
        data: { dueAmount: { decrement: ret.totalAmount } },
      });
    }

    return prisma.supplierReturn.update({ where: { id }, data: { status: newStatus }, include: { items: true } });
  }
}
