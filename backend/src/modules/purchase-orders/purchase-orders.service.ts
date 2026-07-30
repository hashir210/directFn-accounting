import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class PurchaseOrdersService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.status && options.status !== 'all') where.status = options.status;
    if (options.search) {
      where.OR = [
        { orderNo: { contains: options.search } },
        { supplier: { name: { contains: options.search } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, contactEmail: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      items: items.map(o => ({
        ...o,
        subtotal: toNum(o.subtotal),
        taxAmount: toNum(o.taxAmount),
        totalAmount: toNum(o.totalAmount),
        items: o.items.map(i => ({ ...i, unitPrice: toNum(i.unitPrice), taxRate: toNum(i.taxRate), lineTotal: toNum(i.lineTotal) })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(organizationId: string, id: string) {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        supplier: true,
        items: { include: { product: { select: { id: true, name: true, sku: true, purchasePrice: true } } } },
        goodsReceived: { include: { items: true } },
        purchaseBills: true,
      },
    });
    if (!order) throw new NotFoundError('Purchase order not found');
    return {
      ...order,
      subtotal: toNum(order.subtotal),
      taxAmount: toNum(order.taxAmount),
      totalAmount: toNum(order.totalAmount),
      items: order.items.map(i => ({ ...i, unitPrice: toNum(i.unitPrice), taxRate: toNum(i.taxRate), lineTotal: toNum(i.lineTotal) })),
    };
  }

  static async create(organizationId: string, data: {
    supplierId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; taxRate?: number }>;
    expectedDate?: string;
    notes?: string;
  }) {
    const supplier = await prisma.supplier.findFirst({ where: { id: data.supplierId, organizationId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    let subtotal = 0;
    let totalTax = 0;
    const lineItems = data.items.map(item => {
      const taxRate = item.taxRate || 0;
      const baseTotal = item.quantity * item.unitPrice;
      const tax = baseTotal * (taxRate / 100);
      subtotal += baseTotal;
      totalTax += tax;
      return { productId: item.productId, quantity: item.quantity, unitPrice: new Decimal(item.unitPrice), taxRate: new Decimal(taxRate), lineTotal: new Decimal(baseTotal + tax) };
    });

    const count = await prisma.purchaseOrder.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const orderNo = `PO-${year}-${String(count + 1).padStart(4, '0')}`;

    return prisma.purchaseOrder.create({
      data: {
        organizationId,
        orderNo,
        supplierId: data.supplierId,
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(totalTax),
        totalAmount: new Decimal(subtotal + totalTax),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes || null,
        status: 'Draft',
        items: { create: lineItems },
      },
      include: { supplier: { select: { id: true, name: true } }, items: true },
    });
  }

  static async update(organizationId: string, id: string, data: {
    supplierId?: string;
    items?: Array<{ productId: string; quantity: number; unitPrice: number; taxRate?: number }>;
    expectedDate?: string | null;
    notes?: string | null;
  }) {
    const existing = await prisma.purchaseOrder.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundError('Purchase order not found');
    if (existing.status !== 'Draft') throw new BadRequestError('Only draft orders can be edited');

    const updateData: any = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.supplierId) updateData.supplierId = data.supplierId;
    if (data.expectedDate !== undefined) updateData.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;

    if (data.items) {
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      let subtotal = 0;
      let totalTax = 0;
      const lineItems = data.items.map(item => {
        const taxRate = item.taxRate || 0;
        const baseTotal = item.quantity * item.unitPrice;
        const tax = baseTotal * (taxRate / 100);
        subtotal += baseTotal;
        totalTax += tax;
        return { productId: item.productId, quantity: item.quantity, unitPrice: new Decimal(item.unitPrice), taxRate: new Decimal(taxRate), lineTotal: new Decimal(baseTotal + tax) };
      });
      await prisma.purchaseOrderItem.createMany({ data: lineItems.map(i => ({ ...i, purchaseOrderId: id })) });
      updateData.subtotal = new Decimal(subtotal);
      updateData.taxAmount = new Decimal(totalTax);
      updateData.totalAmount = new Decimal(subtotal + totalTax);
    }

    return prisma.purchaseOrder.update({ where: { id }, data: updateData, include: { supplier: { select: { id: true, name: true } }, items: true } });
  }

  static async delete(organizationId: string, id: string) {
    const existing = await prisma.purchaseOrder.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundError('Purchase order not found');
    if (existing.status !== 'Draft') throw new BadRequestError('Only draft orders can be deleted');
    await prisma.purchaseOrder.delete({ where: { id } });
    return { message: 'Purchase order deleted' };
  }

  static async send(organizationId: string, id: string) {
    const order = await prisma.purchaseOrder.findFirst({ where: { id, organizationId } });
    if (!order) throw new NotFoundError('Purchase order not found');
    if (order.status !== 'Draft') throw new BadRequestError('Only draft orders can be sent');
    return prisma.purchaseOrder.update({ where: { id }, data: { status: 'Sent' }, include: { supplier: true, items: true } });
  }

  static async receiveGoods(organizationId: string, id: string, data: {
    items: Array<{ productId: string; orderedQty: number; receivedQty: number; acceptedQty: number; rejectedQty?: number }>;
    notes?: string;
  }) {
    const order = await prisma.purchaseOrder.findFirst({ where: { id, organizationId }, include: { items: true } });
    if (!order) throw new NotFoundError('Purchase order not found');
    if (!['Sent', 'Partially Received'].includes(order.status)) throw new BadRequestError('Order must be Sent or Partially Received to receive goods');

    const count = await prisma.goodsReceived.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const grnNo = `GRN-${year}-${String(count + 1).padStart(4, '0')}`;

    const grn = await prisma.goodsReceived.create({
      data: {
        organizationId,
        grnNo,
        purchaseOrderId: id,
        notes: data.notes || null,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            orderedQty: item.orderedQty,
            receivedQty: item.receivedQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty || 0,
          })),
        },
      },
      include: { items: true },
    });

    // Update stock quantities and PO item received quantities
    for (const item of data.items) {
      if (item.acceptedQty > 0) {
        await prisma.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.acceptedQty } } });
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          await prisma.stockMovement.create({
            data: { organizationId, type: 'Stock In', productId: item.productId, sku: product.sku, itemName: product.name, quantity: item.acceptedQty, warehouse: 'Main Warehouse', status: 'Completed' },
          });
        }
      }
      // Update receivedQty on PO item
      const poItem = order.items.find(i => i.productId === item.productId);
      if (poItem) {
        await prisma.purchaseOrderItem.update({ where: { id: poItem.id }, data: { receivedQty: { increment: item.receivedQty } } });
      }
    }

    // Check if all items fully received
    const updatedItems = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
    const allReceived = updatedItems.every(i => i.receivedQty >= i.quantity);
    await prisma.purchaseOrder.update({ where: { id }, data: { status: allReceived ? 'Received' : 'Partially Received' } });

    return grn;
  }

  static async createInvoice(organizationId: string, id: string, dueDate: string) {
    const order = await prisma.purchaseOrder.findFirst({ where: { id, organizationId }, include: { supplier: true, purchaseBills: true } });
    if (!order) throw new NotFoundError('Purchase order not found');
    if (!['Sent', 'Partially Received', 'Received'].includes(order.status)) throw new BadRequestError('Cannot create invoice for this order status');

    const existingBill = order.purchaseBills.find(b => b.status === 'Unpaid' || b.status === 'Paid');
    if (existingBill) throw new BadRequestError(`Purchase bill ${existingBill.billNo} already exists for this order`);

    const count = await prisma.purchaseBill.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const billNo = `PB-${year}-${String(count + 1).padStart(4, '0')}`;

    const bill = await prisma.purchaseBill.create({
      data: {
        organizationId,
        supplierId: order.supplierId,
        purchaseOrderId: id,
        billNo,
        amount: order.totalAmount,
        dueDate: new Date(dueDate),
        status: 'Unpaid',
      },
    });

    // Update supplier due amount
    await prisma.supplier.update({
      where: { id: order.supplierId },
      data: { dueAmount: { increment: order.totalAmount } },
    });

    return bill;
  }

  // Goods received list
  static async listGRN(organizationId: string, options: { page?: number; limit?: number }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    const [items, total] = await Promise.all([
      prisma.goodsReceived.findMany({
        where,
        include: {
          purchaseOrder: { select: { id: true, orderNo: true, supplier: { select: { id: true, name: true } } } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.goodsReceived.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // Purchase invoices list
  static async listPurchaseInvoices(organizationId: string, options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.status && options.status !== 'all') where.status = options.status;

    const [items, total] = await Promise.all([
      prisma.purchaseBill.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, orderNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseBill.count({ where }),
    ]);

    return {
      items: items.map(b => ({ ...b, amount: toNum(b.amount), paidAmount: toNum(b.paidAmount) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
