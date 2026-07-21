import prisma from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class SuppliersService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { category: { contains: options.search } },
        { contactEmail: { contains: options.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
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
    const supplier = await prisma.supplier.findFirst({
      where: { id, organizationId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });

    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  static async create(organizationId: string, data: { name: string; category?: string; contactEmail?: string; phone?: string; paymentTerms?: string; dueAmount?: number }) {
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
        dueAmount: data.dueAmount !== undefined ? data.dueAmount : 0,
      },
    });
  }

  static async update(organizationId: string, id: string, data: Partial<{ name: string; category: string; contactEmail: string; phone: string; paymentTerms: string; dueAmount: number; status: string }>) {
    await this.getById(organizationId, id);
    return prisma.supplier.update({ where: { id }, data });
  }

  static async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    return prisma.supplier.delete({ where: { id } });
  }
}
