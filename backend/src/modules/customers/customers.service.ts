import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CustomersService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { email: { contains: options.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
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
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: { invoices: { orderBy: { createdAt: 'desc' } } },
    });

    if (!customer) {
      const err: any = new Error('Customer not found');
      err.statusCode = 404;
      throw err;
    }

    return customer;
  }

  static async create(organizationId: string, data: { name: string; email?: string; phone?: string; address?: string }) {
    if (data.email) {
      const existing = await prisma.customer.findFirst({
        where: { organizationId, email: data.email },
      });
      if (existing) {
        const err: any = new Error('Customer with this email already exists in organization');
        err.statusCode = 409;
        throw err;
      }
    }

    return prisma.customer.create({
      data: {
        organizationId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      },
    });
  }

  static async update(organizationId: string, id: string, data: { name?: string; email?: string; phone?: string; address?: string }) {
    await this.getById(organizationId, id);

    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);

    return prisma.customer.delete({
      where: { id },
    });
  }
}
