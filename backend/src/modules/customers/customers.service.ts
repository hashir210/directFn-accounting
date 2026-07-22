import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class CustomersService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { email: { contains: options.search } },
        { phone: { contains: options.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoices: {
            where: { status: { in: ['pending', 'unpaid', 'overdue'] } },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    const formattedItems = items.map((customer) => {
      const outstandingSum = customer.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const { invoices, ...rest } = customer;
      return {
        ...rest,
        outstanding: outstandingSum.toFixed(2),
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
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: { invoices: { orderBy: { createdAt: 'desc' } } },
    });

    if (!customer) throw new NotFoundError('Customer not found');

    const outstandingSum = customer.invoices
      .filter((inv) => ['pending', 'unpaid', 'overdue'].includes(inv.status.toLowerCase()))
      .reduce((sum, inv) => sum + Number(inv.amount), 0);

    return {
      ...customer,
      outstanding: outstandingSum.toFixed(2),
    };
  }

  static async create(organizationId: string, data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
    status?: string;
  }) {
    if (data.email) {
      const existing = await prisma.customer.findFirst({
        where: { organizationId, email: data.email },
      });
      if (existing) throw new ConflictError('Customer with this email already exists in organization');
    }

    return prisma.customer.create({
      data: {
        organizationId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        creditLimit: data.creditLimit !== undefined ? new Decimal(data.creditLimit) : 0,
        status: data.status || 'Active',
      },
    });
  }

  static async update(organizationId: string, id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    creditLimit: number;
    status: string;
  }>) {
    await this.getById(organizationId, id);

    const updateData: any = { ...data };
    if (data.creditLimit !== undefined) updateData.creditLimit = new Decimal(data.creditLimit);

    return prisma.customer.update({ where: { id }, data: updateData });
  }

  static async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    return prisma.customer.delete({ where: { id } });
  }

  static async getStatement(organizationId: string, id: string) {
    const customer = await this.getById(organizationId, id);
    const invoices = await prisma.invoice.findMany({
      where: { organizationId, customerId: id },
      orderBy: { issuedAt: 'desc' },
    });

    return {
      customer,
      statementDate: new Date().toISOString(),
      invoices,
      totalInvoiced: invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      totalOutstanding: customer.outstanding,
    };
  }
}

