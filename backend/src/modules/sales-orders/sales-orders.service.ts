import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class SalesOrdersService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const where: any = org?.isPlatform ? {} : { organizationId };
    if (options.status && options.status !== 'all') where.status = options.status;
    if (options.search) {
      where.OR = [
        { orderNo: { contains: options.search } },
        { customer: { name: { contains: options.search } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          discount: { select: { id: true, name: true, type: true, value: true } },
          coupon: { select: { id: true, code: true, discountType: true, discountValue: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return {
      items: items.map(o => ({
        ...o,
        subtotal: toNum(o.subtotal),
        discountAmount: toNum(o.discountAmount),
        taxAmount: toNum(o.taxAmount),
        totalAmount: toNum(o.totalAmount),
        items: o.items.map(i => ({ ...i, unitPrice: toNum(i.unitPrice), discount: toNum(i.discount), taxRate: toNum(i.taxRate), lineTotal: toNum(i.lineTotal) })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(organizationId: string, id: string) {
    const order = await prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true, sellingPrice: true } } } },
        discount: true,
        coupon: true,
        salesInvoices: true,
      },
    });
    if (!order) throw new NotFoundError('Sales order not found');
    return {
      ...order,
      subtotal: toNum(order.subtotal),
      discountAmount: toNum(order.discountAmount),
      taxAmount: toNum(order.taxAmount),
      totalAmount: toNum(order.totalAmount),
      items: order.items.map(i => ({ ...i, unitPrice: toNum(i.unitPrice), discount: toNum(i.discount), taxRate: toNum(i.taxRate), lineTotal: toNum(i.lineTotal) })),
    };
  }

  static async create(organizationId: string, data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; discount?: number; taxRate?: number }>;
    discountId?: string;
    couponCode?: string;
    notes?: string;
  }) {
    // Validate customer
    const customer = await prisma.customer.findFirst({ where: { id: data.customerId, organizationId } });
    if (!customer) throw new NotFoundError('Customer not found');

    // Validate products
    for (const item of data.items) {
      const product = await prisma.product.findFirst({ where: { id: item.productId, organizationId } });
      if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
    }

    // Calculate line items
    let subtotal = 0;
    let totalTax = 0;
    const lineItems = data.items.map(item => {
      const itemDiscount = item.discount || 0;
      const itemTaxRate = item.taxRate || 0;
      const baseTotal = item.quantity * item.unitPrice - itemDiscount;
      const tax = baseTotal * (itemTaxRate / 100);
      const lineTotal = baseTotal + tax;
      subtotal += baseTotal;
      totalTax += tax;
      return { productId: item.productId, quantity: item.quantity, unitPrice: new Decimal(item.unitPrice), discount: new Decimal(itemDiscount), taxRate: new Decimal(itemTaxRate), lineTotal: new Decimal(lineTotal) };
    });

    // Apply discount
    let discountAmount = 0;
    if (data.discountId) {
      const discount = await prisma.discount.findFirst({ where: { id: data.discountId, organizationId, isActive: true } });
      if (!discount) throw new NotFoundError('Discount not found or inactive');
      if (discount.minOrderAmount && subtotal < toNum(discount.minOrderAmount)) throw new BadRequestError(`Minimum order amount for this discount is ${toNum(discount.minOrderAmount)}`);
      if (discount.type === 'percentage') {
        discountAmount = subtotal * (toNum(discount.value) / 100);
        if (discount.maxDiscount) discountAmount = Math.min(discountAmount, toNum(discount.maxDiscount));
      } else {
        discountAmount = toNum(discount.value);
      }
    }

    // Apply coupon
    let couponId: string | null = null;
    if (data.couponCode) {
      const coupon = await prisma.coupon.findFirst({ where: { organizationId, code: data.couponCode, isActive: true } });
      if (!coupon) throw new NotFoundError('Coupon not found or inactive');
      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) throw new BadRequestError('Coupon has expired or is not yet active');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new BadRequestError('Coupon usage limit reached');
      if (coupon.minOrderAmount && subtotal < toNum(coupon.minOrderAmount)) throw new BadRequestError(`Minimum order amount for this coupon is ${toNum(coupon.minOrderAmount)}`);

      let couponDiscount = 0;
      if (coupon.discountType === 'percentage') {
        couponDiscount = subtotal * (toNum(coupon.discountValue) / 100);
        if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, toNum(coupon.maxDiscount));
      } else {
        couponDiscount = toNum(coupon.discountValue);
      }
      discountAmount += couponDiscount;
      couponId = coupon.id;
    }

    const totalAmount = subtotal - discountAmount + totalTax;

    // Generate order number
    const count = await prisma.salesOrder.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const orderNo = `SO-${year}-${String(count + 1).padStart(4, '0')}`;

    const order = await prisma.salesOrder.create({
      data: {
        organizationId,
        orderNo,
        customerId: data.customerId,
        discountId: data.discountId || null,
        couponId,
        subtotal: new Decimal(subtotal),
        discountAmount: new Decimal(discountAmount),
        taxAmount: new Decimal(totalTax),
        totalAmount: new Decimal(totalAmount),
        notes: data.notes || null,
        status: 'Draft',
        items: { create: lineItems },
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    return order;
  }

  static async update(organizationId: string, id: string, data: {
    customerId?: string;
    items?: Array<{ productId: string; quantity: number; unitPrice: number; discount?: number; taxRate?: number }>;
    discountId?: string | null;
    couponCode?: string | null;
    notes?: string | null;
  }) {
    const existing = await prisma.salesOrder.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundError('Sales order not found');
    if (existing.status !== 'Draft') throw new BadRequestError('Only draft orders can be edited');

    const updateData: any = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.customerId) updateData.customerId = data.customerId;
    if (data.discountId !== undefined) updateData.discountId = data.discountId;

    if (data.items) {
      await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: id } });

      let subtotal = 0;
      let totalTax = 0;
      const lineItems = data.items.map(item => {
        const itemDiscount = item.discount || 0;
        const itemTaxRate = item.taxRate || 0;
        const baseTotal = item.quantity * item.unitPrice - itemDiscount;
        const tax = baseTotal * (itemTaxRate / 100);
        subtotal += baseTotal;
        totalTax += tax;
        return { productId: item.productId, quantity: item.quantity, unitPrice: new Decimal(item.unitPrice), discount: new Decimal(itemDiscount), taxRate: new Decimal(itemTaxRate), lineTotal: new Decimal(baseTotal + tax) };
      });

      await prisma.salesOrderItem.createMany({ data: lineItems.map(i => ({ ...i, salesOrderId: id })) });
      updateData.subtotal = new Decimal(subtotal);
      updateData.taxAmount = new Decimal(totalTax);
      updateData.totalAmount = new Decimal(subtotal - toNum(existing.discountAmount) + totalTax);
    }

    return prisma.salesOrder.update({ where: { id }, data: updateData, include: { customer: { select: { id: true, name: true } }, items: true } });
  }

  static async delete(organizationId: string, id: string) {
    const existing = await prisma.salesOrder.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundError('Sales order not found');
    if (existing.status !== 'Draft') throw new BadRequestError('Only draft orders can be deleted');
    await prisma.salesOrder.delete({ where: { id } });
    return { message: 'Sales order deleted' };
  }

  static async confirm(organizationId: string, id: string) {
    const order = await prisma.salesOrder.findFirst({ where: { id, organizationId } });
    if (!order) throw new NotFoundError('Sales order not found');
    if (order.status !== 'Draft') throw new BadRequestError('Only draft orders can be confirmed');
    return prisma.salesOrder.update({ where: { id }, data: { status: 'Confirmed' }, include: { customer: { select: { id: true, name: true } }, items: true } });
  }

  static async generateInvoice(organizationId: string, id: string, dueDate?: string) {
    const order = await prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: { items: true, customer: true },
    });
    if (!order) throw new NotFoundError('Sales order not found');
    if (order.status !== 'Confirmed') throw new BadRequestError('Only confirmed orders can be invoiced');

    const count = await prisma.salesInvoice.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const invoiceNo = `SI-${year}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.salesInvoice.create({
      data: {
        organizationId,
        invoiceNo,
        salesOrderId: id,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        taxAmount: order.taxAmount,
        totalAmount: order.totalAmount,
        dueAt: new Date(dueDate || Date.now() + 14 * 86400000),
        status: 'Unpaid',
        items: {
          create: order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: true },
    });

    // Update order status
    await prisma.salesOrder.update({ where: { id }, data: { status: 'Invoiced' } });

    // Deduct stock
    for (const item of order.items) {
      await prisma.product.update({ where: { id: item.productId }, data: { stockQuantity: { decrement: item.quantity } } });
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await prisma.stockMovement.create({
          data: { organizationId, type: 'Stock Out', productId: item.productId, sku: product.sku, itemName: product.name, quantity: item.quantity, warehouse: 'Main Warehouse', status: 'Completed' },
        });
      }
    }

    // Increment coupon usage
    if (order.couponId) {
      await prisma.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
      await prisma.couponUsage.create({ data: { couponId: order.couponId, customerId: order.customerId } });
    }

    return invoice;
  }
}
