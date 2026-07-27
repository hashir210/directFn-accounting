import prisma from '../../config/db';
import { NotFoundError } from '../../utils/errors';
import { computeBalance, toNumber } from '../../utils/accounting';

export class AccountingService {
  static async getAccountBalances(organizationId: string, options?: {
    from?: string;
    to?: string;
    postedOnly?: boolean;
  }) {
    const accounts = await prisma.account.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    const entryWhere: Record<string, unknown> = { organizationId };
    if (options?.postedOnly !== false) entryWhere.status = 'posted';
    if (options?.from || options?.to) {
      entryWhere.date = {};
      if (options.from) (entryWhere.date as Record<string, Date>).gte = new Date(options.from);
      if (options.to) (entryWhere.date as Record<string, Date>).lte = new Date(options.to);
    }

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: entryWhere,
        account: { organizationId },
      },
      select: { accountId: true, debit: true, credit: true },
    });

    const totals = new Map<string, { debit: number; credit: number }>();
    for (const line of lines) {
      const current = totals.get(line.accountId) || { debit: 0, credit: 0 };
      current.debit += toNumber(line.debit);
      current.credit += toNumber(line.credit);
      totals.set(line.accountId, current);
    }

    return accounts.map((a) => {
      const t = totals.get(a.id) || { debit: 0, credit: 0 };
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        parentId: a.parentId,
        totalDebit: t.debit,
        totalCredit: t.credit,
        balance: computeBalance(a.type, t.debit, t.credit),
      };
    });
  }

  static async getGeneralLedger(organizationId: string, options: {
    accountId?: string;
    from?: string;
    to?: string;
  }) {
    const entryWhere: Record<string, unknown> = { organizationId, status: 'posted' };
    if (options.from || options.to) {
      entryWhere.date = {};
      if (options.from) (entryWhere.date as Record<string, Date>).gte = new Date(options.from);
      if (options.to) (entryWhere.date as Record<string, Date>).lte = new Date(options.to);
    }

    const lineWhere: Record<string, unknown> = {
      journalEntry: entryWhere,
      account: { organizationId },
    };
    if (options.accountId) lineWhere.accountId = options.accountId;

    const lines = await prisma.journalLine.findMany({
      where: lineWhere,
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
        journalEntry: { select: { id: true, entryNo: true, date: true, description: true, status: true } },
      },
      orderBy: [{ journalEntry: { date: 'asc' } }, { createdAt: 'asc' }],
    });

    let runningBalance = 0;
    const accountType = options.accountId
      ? lines[0]?.account.type
      : undefined;

    return lines.map((l) => {
      const debit = toNumber(l.debit);
      const credit = toNumber(l.credit);
      if (options.accountId && l.account.type) {
        runningBalance += computeBalance(l.account.type, debit, credit);
      }
      return {
        id: l.id,
        entryNo: l.journalEntry.entryNo,
        entryId: l.journalEntry.id,
        date: l.journalEntry.date.toISOString().split('T')[0],
        description: l.journalEntry.description,
        accountCode: l.account.code,
        accountName: l.account.name,
        accountType: l.account.type,
        debit,
        credit,
        memo: l.memo,
        runningBalance: options.accountId ? runningBalance : undefined,
      };
    });
  }

  static async getTrialBalance(organizationId: string, options?: { from?: string; to?: string }) {
    const balances = await this.getAccountBalances(organizationId, { ...options, postedOnly: true });

    const rows = balances
      .filter((b) => b.totalDebit > 0 || b.totalCredit > 0 || b.balance !== 0)
      .map((b) => ({
        code: b.code,
        name: b.name,
        type: b.type,
        debit: b.balance > 0 && (b.type === 'ASSET' || b.type === 'EXPENSE') ? b.balance : (b.totalDebit > b.totalCredit ? b.totalDebit - b.totalCredit : 0),
        credit: b.balance > 0 && (b.type === 'LIABILITY' || b.type === 'EQUITY' || b.type === 'INCOME') ? b.balance : (b.totalCredit > b.totalDebit ? b.totalCredit - b.totalDebit : 0),
        balance: b.balance,
      }));

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return { rows, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }

  static async getBalanceSheet(organizationId: string, asOf?: string) {
    const balances = await this.getAccountBalances(organizationId, {
      to: asOf,
      postedOnly: true,
    });

    const group = (type: string) =>
      balances
        .filter((b) => b.type === type && b.balance !== 0)
        .map((b) => ({ code: b.code, name: b.name, balance: b.balance }));

    const assets = group('ASSET');
    const liabilities = group('LIABILITY');
    const equity = group('EQUITY');

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

    return {
      asOf: asOf || new Date().toISOString().split('T')[0],
      assets: { accounts: assets, total: totalAssets },
      liabilities: { accounts: liabilities, total: totalLiabilities },
      equity: { accounts: equity, total: totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  static async getProfitAndLoss(organizationId: string, options?: { from?: string; to?: string; year?: number }) {
    let from = options?.from;
    let to = options?.to;
    if (options?.year && !from && !to) {
      from = `${options.year}-01-01`;
      to = `${options.year}-12-31`;
    }

    const balances = await this.getAccountBalances(organizationId, { from, to, postedOnly: true });

    const incomeAccounts = balances.filter((b) => b.type === 'INCOME' && b.balance !== 0);
    const expenseAccounts = balances.filter((b) => b.type === 'EXPENSE' && b.balance !== 0);

    const totalIncome = incomeAccounts.reduce((s, a) => s + a.balance, 0);
    const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);

    return {
      period: { from, to },
      income: {
        accounts: incomeAccounts.map((a) => ({ code: a.code, name: a.name, amount: a.balance })),
        total: totalIncome,
      },
      expenses: {
        accounts: expenseAccounts.map((a) => ({ code: a.code, name: a.name, amount: a.balance })),
        total: totalExpenses,
      },
      netProfit: totalIncome - totalExpenses,
      grossMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    };
  }

  static async getCashFlow(organizationId: string, options?: { year?: number; from?: string; to?: string }) {
    let from = options?.from;
    let to = options?.to;
    if (options?.year && !from && !to) {
      from = `${options.year}-01-01`;
      to = `${options.year}-12-31`;
    }

    const cashAccount = await prisma.account.findFirst({
      where: { organizationId, code: '1010' },
    });

    const entryWhere: Record<string, unknown> = { organizationId, status: 'posted' };
    if (from || to) {
      entryWhere.date = {};
      if (from) (entryWhere.date as Record<string, Date>).gte = new Date(from);
      if (to) (entryWhere.date as Record<string, Date>).lte = new Date(to);
    }

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: entryWhere,
        ...(cashAccount ? { accountId: cashAccount.id } : { account: { organizationId, code: '1010' } }),
      },
      include: {
        journalEntry: { select: { date: true, description: true, entryNo: true } },
      },
      orderBy: [{ journalEntry: { date: 'asc' } }],
    });

    const monthlyInflow = new Array(12).fill(0);
    const monthlyOutflow = new Array(12).fill(0);

    for (const line of lines) {
      const month = line.journalEntry.date.getMonth();
      const debit = toNumber(line.debit);
      const credit = toNumber(line.credit);
      monthlyInflow[month] += debit;
      monthlyOutflow[month] += credit;
    }

    const totalInflow = lines.reduce((s, l) => s + toNumber(l.debit), 0);
    const totalOutflow = lines.reduce((s, l) => s + toNumber(l.credit), 0);

    return {
      period: { from, to, year: options?.year },
      monthlyData: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        inflow: monthlyInflow[i],
        outflow: monthlyOutflow[i],
        net: monthlyInflow[i] - monthlyOutflow[i],
      })),
      summary: {
        totalOperatingInflow: totalInflow,
        totalOperatingOutflow: totalOutflow,
        netCashFlow: totalInflow - totalOutflow,
      },
      transactions: lines.map((l) => ({
        entryNo: l.journalEntry.entryNo,
        date: l.journalEntry.date.toISOString().split('T')[0],
        description: l.journalEntry.description,
        inflow: toNumber(l.debit),
        outflow: toNumber(l.credit),
      })),
    };
  }
}
