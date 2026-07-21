import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class ReportsService {
  static async getIncomeStatement(organizationId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear + 1, 0, 1);

    const [paidInvoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          organizationId,
          status: 'paid',
          paidAt: { gte: yearStart, lt: yearEnd },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.expense.findMany({
        where: {
          organizationId,
          date: { gte: yearStart, lt: yearEnd },
        },
        select: { amount: true, category: true },
      }),
    ]);

    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + toNumber(inv.amount), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + toNumber(exp.amount), 0);

    const categoryBreakdown: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = exp.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + toNumber(exp.amount);
    }

    return {
      year: targetYear,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      expenseBreakdown: Object.entries(categoryBreakdown).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      })),
    };
  }

  static async getBalanceSheet(organizationId: string) {
    const [accounts, pendingInvoices, unpaidExpenses] = await Promise.all([
      prisma.bankAccount.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, bankName: true, balance: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId, status: 'pending' },
        select: { amount: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId, status: 'overdue' },
        select: { amount: true },
      }),
    ]);

    const totalAssets = accounts.reduce((acc, a) => acc + toNumber(a.balance), 0);
    const receivables = pendingInvoices.reduce((acc, inv) => acc + toNumber(inv.amount), 0);
    const overdueReceivables = unpaidExpenses.reduce((acc, inv) => acc + toNumber(inv.amount), 0);

    return {
      assets: {
        bankAccounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          bankName: a.bankName,
          balance: toNumber(a.balance),
        })),
        totalBankBalance: totalAssets,
        accountsReceivable: receivables,
        overdueReceivables,
        totalAssets: totalAssets + receivables + overdueReceivables,
      },
      liabilities: {
        overduePayables: overdueReceivables,
        totalLiabilities: overdueReceivables,
      },
      equity: {
        retainedEarnings: totalAssets - overdueReceivables,
        totalEquity: totalAssets - overdueReceivables,
      },
    };
  }

  static async getCashFlow(organizationId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear + 1, 0, 1);

    const [paidInvoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          organizationId,
          status: 'paid',
          paidAt: { gte: yearStart, lt: yearEnd },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.expense.findMany({
        where: {
          organizationId,
          date: { gte: yearStart, lt: yearEnd },
        },
        select: { amount: true, date: true },
      }),
    ]);

    const monthlyInflow = new Array(12).fill(0);
    const monthlyOutflow = new Array(12).fill(0);

    for (const inv of paidInvoices) {
      if (inv.paidAt) monthlyInflow[inv.paidAt.getMonth()] += toNumber(inv.amount);
    }
    for (const exp of expenses) {
      if (exp.date) monthlyOutflow[exp.date.getMonth()] += toNumber(exp.amount);
    }

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      inflow: monthlyInflow[i],
      outflow: monthlyOutflow[i],
      net: monthlyInflow[i] - monthlyOutflow[i],
    }));

    const totalOperatingInflow = paidInvoices.reduce((acc, inv) => acc + toNumber(inv.amount), 0);
    const totalOperatingOutflow = expenses.reduce((acc, exp) => acc + toNumber(exp.amount), 0);

    return {
      year: targetYear,
      monthlyData,
      summary: {
        totalOperatingInflow,
        totalOperatingOutflow,
        netCashFlow: totalOperatingInflow - totalOperatingOutflow,
      },
    };
  }
}
