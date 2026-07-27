import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';

function toNum(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class CouponsService {
  static async list(organizationId: string, options: { page?: number; limit?: number; search?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const where: any = org?.isPlatform ? {} : { organizationId };
    if (options.search) {
      where.code = { contains: options.search };
    }

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.coupon.count({ where }),
    ]);

    return {
      items: items.map(c => ({
        ...c,
        discountValue: toNum(c.discountValue),
        minOrderAmount: c.minOrderAmount ? toNum(c.minOrderAmount) : null,
        maxDiscount: c.maxDiscount ? toNum(c.maxDiscount) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(organizationId: string, id: string) {
    const coupon = await prisma.coupon.findFirst({ where: { id, organizationId }, include: { couponUsages: { include: { customer: { select: { id: true, name: true } } }, take: 20 } } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return { ...coupon, discountValue: toNum(coupon.discountValue), minOrderAmount: coupon.minOrderAmount ? toNum(coupon.minOrderAmount) : null, maxDiscount: coupon.maxDiscount ? toNum(coupon.maxDiscount) : null };
  }

  static async create(organizationId: string, data: {
    code: string; discountType: string; discountValue: number; minOrderAmount?: number; maxDiscount?: number; usageLimit?: number; isActive?: boolean; startDate: string; endDate: string;
  }) {
    const existing = await prisma.coupon.findFirst({ where: { organizationId, code: data.code } });
    if (existing) throw new ConflictError('Coupon code already exists');

    return prisma.coupon.create({
      data: {
        organizationId,
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: new Decimal(data.discountValue),
        minOrderAmount: data.minOrderAmount !== undefined ? new Decimal(data.minOrderAmount) : null,
        maxDiscount: data.maxDiscount !== undefined ? new Decimal(data.maxDiscount) : null,
        usageLimit: data.usageLimit || null,
        isActive: data.isActive ?? true,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  static async update(organizationId: string, id: string, data: Partial<{
    code: string; discountType: string; discountValue: number; minOrderAmount: number; maxDiscount: number; usageLimit: number; isActive: boolean; startDate: string; endDate: string;
  }>) {
    await this.getById(organizationId, id);
    const updateData: any = { ...data };
    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.discountValue !== undefined) updateData.discountValue = new Decimal(data.discountValue);
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = new Decimal(data.minOrderAmount);
    if (data.maxDiscount !== undefined) updateData.maxDiscount = new Decimal(data.maxDiscount);
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    return prisma.coupon.update({ where: { id }, data: updateData });
  }

  static async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    await prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted' };
  }

  static async validate(organizationId: string, code: string, orderAmount?: number) {
    const coupon = await prisma.coupon.findFirst({ where: { organizationId, code: code.toUpperCase(), isActive: true } });
    if (!coupon) throw new NotFoundError('Coupon not found or inactive');

    const now = new Date();
    if (now < coupon.startDate) throw new BadRequestError('Coupon is not yet active');
    if (now > coupon.endDate) throw new BadRequestError('Coupon has expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new BadRequestError('Coupon usage limit reached');
    if (coupon.minOrderAmount && orderAmount !== undefined && orderAmount < toNum(coupon.minOrderAmount)) {
      throw new BadRequestError(`Minimum order amount is ${toNum(coupon.minOrderAmount)}`);
    }

    let discountAmount = 0;
    if (orderAmount) {
      if (coupon.discountType === 'percentage') {
        discountAmount = orderAmount * (toNum(coupon.discountValue) / 100);
        if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, toNum(coupon.maxDiscount));
      } else {
        discountAmount = toNum(coupon.discountValue);
      }
    }

    return { valid: true, coupon: { id: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: toNum(coupon.discountValue) }, discountAmount };
  }
}
