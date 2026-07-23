import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError } from '../../utils/errors';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class ExpensesService {
  static async list(organizationId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const where: any = org?.isPlatform ? {} : { organizationId };
    if (options.category && options.category !== 'all') {
      where.category = { contains: options.category, mode: 'insensitive' };
    }
    if (options.search) {
      where.OR = [
        { description: { contains: options.search, mode: 'insensitive' } },
        { category: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: expenses.map((exp) => ({
        id: exp.id,
        vendor: exp.description?.split(' - ')[0] || 'Unknown',
        category: exp.category,
        description: exp.description,
        amount: toNumber(exp.amount),
        date: exp.date.toISOString().split('T')[0],
        status: 'approved',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(organizationId: string, id: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, organizationId },
    });
    if (!expense) throw new NotFoundError('Expense not found');

    return {
      id: expense.id,
      vendor: expense.description?.split(' - ')[0] || 'Unknown',
      category: expense.category,
      description: expense.description,
      amount: toNumber(expense.amount),
      date: expense.date.toISOString().split('T')[0],
      status: 'approved',
    };
  }

  static async create(organizationId: string, data: {
    vendor: string;
    category: string;
    description?: string;
    amount: number;
    date?: string;
  }) {
    const description = data.description
      ? `${data.vendor} - ${data.description}`
      : `${data.vendor} - ${data.category} expense`;

    const expense = await prisma.expense.create({
      data: {
        organizationId,
        category: data.category,
        description,
        amount: new Decimal(data.amount),
        date: new Date(data.date || new Date()),
      },
    });

    return {
      id: expense.id,
      vendor: data.vendor,
      category: expense.category,
      description: expense.description,
      amount: toNumber(expense.amount),
      date: expense.date.toISOString().split('T')[0],
      status: 'approved',
    };
  }

  static async update(organizationId: string, id: string, data: {
    vendor?: string;
    category?: string;
    description?: string;
    amount?: number;
    date?: string;
  }) {
    const existing = await prisma.expense.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundError('Expense not found');

    const updateData: any = {};
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.vendor !== undefined) {
      const desc = existing.description || '';
      const parts = desc.split(' - ');
      parts[0] = data.vendor;
      updateData.description = parts.join(' - ');
    }
    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
    if (data.date !== undefined) updateData.date = new Date(data.date);

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return {
      id: expense.id,
      vendor: data.vendor || (expense.description?.split(' - ')[0] || 'Unknown'),
      category: expense.category,
      description: expense.description,
      amount: toNumber(expense.amount),
      date: expense.date.toISOString().split('T')[0],
      status: 'approved',
    };
  }

  static async delete(organizationId: string, id: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundError('Expense not found');

    await prisma.expense.delete({ where: { id } });
    return { message: 'Expense deleted successfully' };
  }
}
