import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../../utils/accounting';

export class AccountsService {
  static async list(organizationId: string, options?: { type?: string; activeOnly?: boolean }) {
    const where: Record<string, unknown> = { organizationId };
    if (options?.type) where.type = options.type;
    if (options?.activeOnly) where.isActive = true;

    const accounts = await prisma.account.findMany({
      where,
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
      include: { parent: { select: { id: true, code: true, name: true } } },
    });

    return accounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      parentId: a.parentId,
      parent: a.parent,
      isActive: a.isActive,
      isSystem: a.isSystem,
    }));
  }

  static async getById(organizationId: string, id: string) {
    const account = await prisma.account.findFirst({
      where: { id, organizationId },
      include: { parent: { select: { id: true, code: true, name: true } } },
    });
    if (!account) throw new NotFoundError('Account not found');
    return account;
  }

  static async create(organizationId: string, data: {
    code: string;
    name: string;
    type: string;
    parentId?: string;
    isActive?: boolean;
  }) {
    const existing = await prisma.account.findFirst({
      where: { organizationId, code: data.code },
    });
    if (existing) throw new BadRequestError(`Account code ${data.code} already exists`);

    if (data.parentId) {
      const parent = await prisma.account.findFirst({
        where: { id: data.parentId, organizationId },
      });
      if (!parent) throw new NotFoundError('Parent account not found');
    }

    return prisma.account.create({
      data: {
        organizationId,
        code: data.code,
        name: data.name,
        type: data.type,
        parentId: data.parentId || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async update(organizationId: string, id: string, data: {
    code?: string;
    name?: string;
    type?: string;
    parentId?: string | null;
    isActive?: boolean;
  }) {
    const account = await prisma.account.findFirst({ where: { id, organizationId } });
    if (!account) throw new NotFoundError('Account not found');

    if (data.code && data.code !== account.code) {
      const existing = await prisma.account.findFirst({
        where: { organizationId, code: data.code, NOT: { id } },
      });
      if (existing) throw new BadRequestError(`Account code ${data.code} already exists`);
    }

    return prisma.account.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  static async delete(organizationId: string, id: string) {
    const account = await prisma.account.findFirst({ where: { id, organizationId } });
    if (!account) throw new NotFoundError('Account not found');
    if (account.isSystem) throw new BadRequestError('System accounts cannot be deleted');

    const lineCount = await prisma.journalLine.count({ where: { accountId: id } });
    if (lineCount > 0) throw new BadRequestError('Account has journal entries and cannot be deleted');

    const childCount = await prisma.account.count({ where: { parentId: id } });
    if (childCount > 0) throw new BadRequestError('Account has child accounts and cannot be deleted');

    await prisma.account.delete({ where: { id } });
    return { message: 'Account deleted successfully' };
  }

  static async seedDefaultChart(organizationId: string) {
    const existing = await prisma.account.count({ where: { organizationId } });
    if (existing > 0) {
      return { message: 'Chart of accounts already exists', seeded: false };
    }

    const idByCode = new Map<string, string>();

    for (const item of DEFAULT_CHART_OF_ACCOUNTS) {
      const parentId = item.parentCode ? idByCode.get(item.parentCode) ?? null : null;
      const account = await prisma.account.create({
        data: {
          organizationId,
          code: item.code,
          name: item.name,
          type: item.type,
          parentId,
          isSystem: item.isSystem,
        },
      });
      idByCode.set(item.code, account.id);
    }

    return { message: 'Default chart of accounts seeded', seeded: true };
  }

  static async getByCode(organizationId: string, code: string) {
    return prisma.account.findFirst({ where: { organizationId, code } });
  }
}
