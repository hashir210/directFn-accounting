import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class DiscountsService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const where: any = org?.isPlatform ? {} : { organizationId };
    if (options.search) {
      where.name = { contains: options.search };
    }

    const [items, total] = await Promise.all([
      prisma.discount.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.discount.count({ where }),
    ]);

    return {
      items: items.map(d => ({ ...d, value: toNum(d.value), minOrderAmount: d.minOrderAmount ? toNum(d.minOrderAmount) : null, maxDiscount: d.maxDiscount ? toNum(d.maxDiscount) : null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(organizationId: string, id: string) {
    const discount = await prisma.discount.findFirst({ where: { id, organizationId } });
    if (!discount) throw new NotFoundError('Discount not found');
    return { ...discount, value: toNum(discount.value), minOrderAmount: discount.minOrderAmount ? toNum(discount.minOrderAmount) : null, maxDiscount: discount.maxDiscount ? toNum(discount.maxDiscount) : null };
  }

  static async create(organizationId: string, data: {
    name: string; type: string; value: number; minOrderAmount?: number; maxDiscount?: number; isActive?: boolean; startDate?: string; endDate?: string;
  }) {
    return prisma.discount.create({
      data: {
        organizationId,
        name: data.name,
        type: data.type,
        value: new Decimal(data.value),
        minOrderAmount: data.minOrderAmount !== undefined ? new Decimal(data.minOrderAmount) : null,
        maxDiscount: data.maxDiscount !== undefined ? new Decimal(data.maxDiscount) : null,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async update(organizationId: string, id: string, data: Partial<{
    name: string; type: string; value: number; minOrderAmount: number; maxDiscount: number; isActive: boolean; startDate: string; endDate: string;
  }>) {
    await this.getById(organizationId, id);
    const updateData: any = { ...data };
    if (data.value !== undefined) updateData.value = new Decimal(data.value);
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = new Decimal(data.minOrderAmount);
    if (data.maxDiscount !== undefined) updateData.maxDiscount = new Decimal(data.maxDiscount);
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    return prisma.discount.update({ where: { id }, data: updateData });
  }

  static async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    await prisma.discount.delete({ where: { id } });
    return { message: 'Discount deleted' };
  }
}
