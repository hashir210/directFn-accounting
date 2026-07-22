import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class SuppliersService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { category: { contains: options.search } },
        { contactEmail: { contains: options.search } },
        { phone: { contains: options.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        include: {
          purchaseBills: {
            where: { status: { in: ['Unpaid', 'Pending'] } },
            select: { amount: true, paidAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    const formattedItems = items.map((supplier) => {
      const computedDue = supplier.purchaseBills.reduce(
        (sum, bill) => sum + (Number(bill.amount) - Number(bill.paidAmount)),
        0
      );
      const { purchaseBills, ...rest } = supplier;
      return {
        ...rest,
        dueAmount: computedDue > 0 ? computedDue.toFixed(2) : Number(supplier.dueAmount).toFixed(2),
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
    const supplier = await prisma.supplier.findFirst({
      where: { id, organizationId },
      include: {
        payments: { orderBy: { createdAt: 'desc' } },
        purchaseBills: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!supplier) throw new NotFoundError('Supplier not found');

    const computedDue = supplier.purchaseBills
      .filter((bill) => ['unpaid', 'pending'].includes(bill.status.toLowerCase()))
      .reduce((sum, bill) => sum + (Number(bill.amount) - Number(bill.paidAmount)), 0);

    return {
      ...supplier,
      dueAmount: computedDue > 0 ? computedDue.toFixed(2) : Number(supplier.dueAmount).toFixed(2),
    };
  }

  static async create(organizationId: string, data: {
    name: string;
    category?: string;
    contactEmail?: string;
    phone?: string;
    paymentTerms?: string;
    dueAmount?: number;
    status?: string;
  }) {
    const existing = await prisma.supplier.findFirst({
      where: { organizationId, name: data.name },
    });
    if (existing) throw new ConflictError('Supplier with this name already exists in organization');

    return prisma.supplier.create({
      data: {
        organizationId,
        name: data.name,
        category: data.category || null,
        contactEmail: data.contactEmail || null,
        phone: data.phone || null,
        paymentTerms: data.paymentTerms || 'Net 30',
        status: data.status || 'Active',
        dueAmount: data.dueAmount !== undefined ? new Decimal(data.dueAmount) : new Decimal(0),
      },
    });
  }

  static async update(organizationId: string, id: string, data: Partial<{
    name: string;
    category: string;
    contactEmail: string;
    phone: string;
    paymentTerms: string;
    dueAmount: number;
    status: string;
  }>) {
    await this.getById(organizationId, id);

    const updateData: any = { ...data };
    if (data.dueAmount !== undefined) updateData.dueAmount = new Decimal(data.dueAmount);

    return prisma.supplier.update({ where: { id }, data: updateData });
  }

  static async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    return prisma.supplier.delete({ where: { id } });
  }

  static async createPurchaseBill(organizationId: string, data: {
    supplierId: string;
    billNo: string;
    amount: number;
    dueDate: string;
  }) {
    const supplier = await prisma.supplier.findFirst({ where: { id: data.supplierId, organizationId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    const bill = await prisma.purchaseBill.create({
      data: {
        organizationId,
        supplierId: data.supplierId,
        billNo: data.billNo,
        amount: new Decimal(data.amount),
        dueDate: new Date(data.dueDate),
        status: 'Unpaid',
      },
    });

    await prisma.supplier.update({
      where: { id: data.supplierId },
      data: { dueAmount: { increment: new Decimal(data.amount) } },
    });

    return bill;
  }

  static async recordPayment(organizationId: string, data: {
    supplierId: string;
    amount: number;
    note?: string;
  }) {
    const supplier = await prisma.supplier.findFirst({ where: { id: data.supplierId, organizationId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    const payment = await prisma.supplierPayment.create({
      data: {
        supplierId: data.supplierId,
        amount: new Decimal(data.amount),
        note: data.note || null,
      },
    });

    const newDue = Math.max(0, Number(supplier.dueAmount) - data.amount);
    await prisma.supplier.update({
      where: { id: data.supplierId },
      data: { dueAmount: new Decimal(newDue) },
    });

    return payment;
  }
}

