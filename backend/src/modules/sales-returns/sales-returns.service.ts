import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class SalesReturnsService {
  static async list(organizationId: string, options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const where: any = org?.isPlatform ? {} : { organizationId };
    if (options.status && options.status !== 'all') where.status = options.status;

    const [items, total] = await Promise.all([
      prisma.salesReturn.findMany({
        where,
        include: {
          salesInvoice: { select: { id: true, invoiceNo: true, salesOrder: { select: { customer: { select: { id: true, name: true } } } } } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salesReturn.count({ where }),
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
    const ret = await prisma.salesReturn.findFirst({
      where: { id, organizationId },
      include: {
        salesInvoice: { include: { salesOrder: { include: { customer: true } }, items: true } },
        items: { include: { product: true } },
      },
    });
    if (!ret) throw new NotFoundError('Sales return not found');
    return { ...ret, totalAmount: toNum(ret.totalAmount), items: ret.items.map(i => ({ ...i, unitPrice: toNum(i.unitPrice), lineTotal: toNum(i.lineTotal) })) };
  }

  static async create(organizationId: string, data: {
    salesInvoiceId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; reason?: string }>;
    reason?: string;
  }) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: { id: data.salesInvoiceId, organizationId },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundError('Sales invoice not found');

    // Validate return quantities against invoice
    for (const item of data.items) {
      const invoiceItem = invoice.items.find(i => i.productId === item.productId);
      if (!invoiceItem) throw new BadRequestError(`Product ${item.productId} not found on this invoice`);
      if (item.quantity > invoiceItem.quantity) throw new BadRequestError(`Return quantity cannot exceed invoiced quantity for product ${item.productId}`);
    }

    let totalAmount = 0;
    const lineItems = data.items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      totalAmount += lineTotal;
      return { productId: item.productId, quantity: item.quantity, unitPrice: new Decimal(item.unitPrice), lineTotal: new Decimal(lineTotal), reason: item.reason || null };
    });

    const count = await prisma.salesReturn.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const returnNo = `SR-${year}-${String(count + 1).padStart(4, '0')}`;

    return prisma.salesReturn.create({
      data: {
        organizationId,
        returnNo,
        salesInvoiceId: data.salesInvoiceId,
        totalAmount: new Decimal(totalAmount),
        reason: data.reason || null,
        status: 'Pending',
        items: { create: lineItems },
      },
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
    });
  }

  static async process(organizationId: string, id: string, action: 'approve' | 'reject') {
    const ret = await prisma.salesReturn.findFirst({ where: { id, organizationId }, include: { items: true } });
    if (!ret) throw new NotFoundError('Sales return not found');
    if (ret.status !== 'Pending') throw new BadRequestError('Only pending returns can be processed');

    if (action === 'approve') {
      // Restore stock
      for (const item of ret.items) {
        await prisma.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          await prisma.stockMovement.create({
            data: { organizationId, type: 'Stock In', productId: item.productId, sku: product.sku, itemName: product.name, quantity: item.quantity, warehouse: 'Main Warehouse', status: 'Completed' },
          });
        }
      }
    }

    return prisma.salesReturn.update({ where: { id }, data: { status: action === 'approve' ? 'Approved' : 'Rejected' }, include: { items: true } });
  }
}
