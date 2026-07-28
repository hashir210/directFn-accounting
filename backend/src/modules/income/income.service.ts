import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError } from '../../utils/errors';
import { toNumber, INCOME_CATEGORY_ACCOUNT_CODE } from '../../utils/accounting';
import { AccountsService } from '../accounts/accounts.service';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';

function formatIncome(record: {
  id: string;
  category: string | null;
  description: string | null;
  amount: Decimal;
  date: Date;
  referenceNo: string | null;
}) {
  return {
    id: record.id,
    category: record.category || '',
    description: record.description,
    amount: toNumber(record.amount),
    date: record.date.toISOString().split('T')[0],
    referenceNo: record.referenceNo,
  };
}

async function postIncomeJournal(organizationId: string, income: {
  id: string;
  category: string | null;
  amount: number;
  date: Date;
  description: string | null;
  referenceNo: string | null;
}) {
  const accountCode = (income.category && INCOME_CATEGORY_ACCOUNT_CODE[income.category]) || '4040';
  let incomeAccount = await AccountsService.getByCode(organizationId, accountCode);
  let cashAccount = await AccountsService.getByCode(organizationId, '1010');

  if (!incomeAccount || !cashAccount) {
    await AccountsService.seedDefaultChart(organizationId);
    incomeAccount = await AccountsService.getByCode(organizationId, accountCode);
    cashAccount = await AccountsService.getByCode(organizationId, '1010');
  }
  if (!incomeAccount || !cashAccount) return;

  await JournalEntriesService.create(organizationId, {
    date: income.date.toISOString().split('T')[0],
    description: income.description || `${income.category} income${income.referenceNo ? ` - ${income.referenceNo}` : ''}`,
    status: 'posted',
    referenceType: 'income',
    referenceId: income.id,
    lines: [
      { accountId: cashAccount.id, debit: income.amount, credit: 0 },
      { accountId: incomeAccount.id, debit: 0, credit: income.amount },
    ],
  });
}

export class IncomeService {
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
    const where: Record<string, unknown> = org?.isPlatform ? {} : { organizationId };

    if (options.category && options.category !== 'all') {
      where.category = options.category;
    }
    if (options.search) {
      where.OR = [
        { description: { contains: options.search } },
        { category: { contains: options.search } },
        { referenceNo: { contains: options.search } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.income.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit }),
      prisma.income.count({ where }),
    ]);

    return {
      data: records.map(formatIncome),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(organizationId: string, id: string) {
    const record = await prisma.income.findFirst({ where: { id, organizationId } });
    if (!record) throw new NotFoundError('Income record not found');
    return formatIncome(record);
  }

  static async create(organizationId: string, data: {
    category: string | null;
    description?: string;
    amount: number;
    date?: string;
    referenceNo?: string;
  }) {
    const record = await prisma.income.create({
      data: {
        organizationId,
        category: data.category,
        description: data.description,
        amount: new Decimal(data.amount),
        date: new Date(data.date || new Date()),
        referenceNo: data.referenceNo,
      },
    });

    await postIncomeJournal(organizationId, {
      id: record.id,
      category: record.category || '',
      amount: data.amount,
      date: record.date,
      description: record.description,
      referenceNo: record.referenceNo,
    });

    return formatIncome(record);
  }

  static async update(organizationId: string, id: string, data: {
    category?: string;
    description?: string;
    amount?: number;
    date?: string;
    referenceNo?: string;
  }) {
    const existing = await prisma.income.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundError('Income record not found');

    const record = await prisma.income.update({
      where: { id },
      data: {
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount: new Decimal(data.amount) }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.referenceNo !== undefined && { referenceNo: data.referenceNo }),
      },
    });

    await prisma.journalEntry.deleteMany({
      where: { organizationId, referenceType: 'income', referenceId: id },
    });
    await postIncomeJournal(organizationId, {
      id: record.id,
      category: record.category || '',
      amount: toNumber(record.amount),
      date: record.date,
      description: record.description,
      referenceNo: record.referenceNo,
    });

    return formatIncome(record);
  }

  static async delete(organizationId: string, id: string) {
    const existing = await prisma.income.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundError('Income record not found');
    await prisma.$transaction([
      prisma.journalEntry.deleteMany({
        where: { organizationId, referenceType: 'income', referenceId: id },
      }),
      prisma.income.delete({ where: { id } }),
    ]);
    return { message: 'Income record deleted successfully' };
  }
}
