import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { toNumber } from '../../utils/accounting';

function formatEntry(entry: {
  id: string;
  entryNo: string;
  date: Date;
  description: string | null;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
  lines: Array<{
    id: string;
    accountId: string;
    debit: Decimal;
    credit: Decimal;
    memo: string | null;
    account: { code: string; name: string; type: string };
  }>;
}) {
  const totalDebit = entry.lines.reduce((s, l) => s + toNumber(l.debit), 0);
  const totalCredit = entry.lines.reduce((s, l) => s + toNumber(l.credit), 0);
  return {
    id: entry.id,
    entryNo: entry.entryNo,
    date: entry.date.toISOString().split('T')[0],
    description: entry.description,
    status: entry.status,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    totalDebit,
    totalCredit,
    lines: entry.lines.map((l) => ({
      id: l.id,
      accountId: l.accountId,
      accountCode: l.account.code,
      accountName: l.account.name,
      accountType: l.account.type,
      debit: toNumber(l.debit),
      credit: toNumber(l.credit),
      memo: l.memo,
    })),
    createdAt: entry.createdAt.toISOString(),
  };
}

export class JournalEntriesService {
  static async list(organizationId: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };
    if (options?.status) where.status = options.status;
    if (options?.from || options?.to) {
      where.date = {};
      if (options.from) (where.date as Record<string, Date>).gte = new Date(options.from);
      if (options.to) (where.date as Record<string, Date>).lte = new Date(options.to);
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          lines: {
            include: { account: { select: { code: true, name: true, type: true } } },
          },
        },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return {
      data: entries.map(formatEntry),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(organizationId: string, id: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: { account: { select: { code: true, name: true, type: true } } },
        },
      },
    });
    if (!entry) throw new NotFoundError('Journal entry not found');
    return formatEntry(entry);
  }

  static async create(organizationId: string, data: {
    date?: string;
    description?: string;
    lines: Array<{ accountId: string; debit: number; credit: number; memo?: string }>;
    status?: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestError('Total debits must equal total credits');
    }

    for (const line of data.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestError('A line cannot have both debit and credit');
      }
      const account = await prisma.account.findFirst({
        where: { id: line.accountId, organizationId },
      });
      if (!account) throw new NotFoundError(`Account ${line.accountId} not found`);
    }

    const count = await prisma.journalEntry.count({ where: { organizationId } });
    const entryNo = `JE-${String(count + 1).padStart(5, '0')}`;

    const entry = await prisma.journalEntry.create({
      data: {
        organizationId,
        entryNo,
        date: new Date(data.date || new Date()),
        description: data.description,
        status: data.status || 'draft',
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        lines: {
          create: data.lines.map((l) => ({
            accountId: l.accountId,
            debit: new Decimal(l.debit),
            credit: new Decimal(l.credit),
            memo: l.memo,
          })),
        },
      },
      include: {
        lines: {
          include: { account: { select: { code: true, name: true, type: true } } },
        },
      },
    });

    return formatEntry(entry);
  }

  static async update(organizationId: string, id: string, data: {
    date?: string;
    description?: string;
    lines?: Array<{ accountId: string; debit: number; credit: number; memo?: string }>;
  }) {
    const existing = await prisma.journalEntry.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundError('Journal entry not found');
    if (existing.status === 'posted') throw new BadRequestError('Posted entries cannot be edited');

    if (data.lines) {
      const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new BadRequestError('Total debits must equal total credits');
      }
    }

    await prisma.$transaction(async (tx) => {
      if (data.lines) {
        await tx.journalLine.deleteMany({ where: { journalEntryId: id } });
        await tx.journalLine.createMany({
          data: data.lines.map((l) => ({
            journalEntryId: id,
            accountId: l.accountId,
            debit: new Decimal(l.debit),
            credit: new Decimal(l.credit),
            memo: l.memo,
          })),
        });
      }
      await tx.journalEntry.update({
        where: { id },
        data: {
          ...(data.date !== undefined && { date: new Date(data.date) }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });
    });

    return this.getById(organizationId, id);
  }

  static async post(organizationId: string, id: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, organizationId },
      include: { lines: true },
    });
    if (!entry) throw new NotFoundError('Journal entry not found');
    if (entry.status === 'posted') throw new BadRequestError('Entry is already posted');

    const totalDebit = entry.lines.reduce((s, l) => s + toNumber(l.debit), 0);
    const totalCredit = entry.lines.reduce((s, l) => s + toNumber(l.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestError('Total debits must equal total credits before posting');
    }

    await prisma.journalEntry.update({
      where: { id },
      data: { status: 'posted' },
    });

    return this.getById(organizationId, id);
  }

  static async delete(organizationId: string, id: string) {
    const entry = await prisma.journalEntry.findFirst({ where: { id, organizationId } });
    if (!entry) throw new NotFoundError('Journal entry not found');
    if (entry.status === 'posted') throw new BadRequestError('Posted entries cannot be deleted');

    await prisma.journalEntry.delete({ where: { id } });
    return { message: 'Journal entry deleted successfully' };
  }
}
