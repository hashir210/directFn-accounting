import prisma from '../../config/db';
import { Decimal } from '@prisma/client/runtime/library';

function toNumber(d: Decimal | any): number {
  return d ? Number(d.toString()) : 0;
}

export class ReportsService {
  static async getProfitLoss(organizationId: string, startDate?: string, endDate?: string) {
    const whereInvoice: any = { organizationId, status: { not: 'cancelled' } };
    const whereExpense: any = { organizationId };

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      whereInvoice.issuedAt = dateFilter;
      whereExpense.date = dateFilter;
    }

    // Revenue from Invoices
    const invoices = await prisma.invoice.findMany({ where: whereInvoice });
    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + toNumber(inv.amount), 0);

    // Expenses
    const expenses = await prisma.expense.findMany({ where: whereExpense });
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + toNumber(exp.amount), 0);

    const netProfit = totalRevenue - totalExpenses;

    // Monthly breakdown for chart (simple logic)
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    
    invoices.forEach((inv: any) => {
      const month = inv.issuedAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
      monthlyData[month].revenue += toNumber(inv.amount);
    });

    expenses.forEach((exp: any) => {
      const month = exp.date.toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
      monthlyData[month].expenses += toNumber(exp.amount);
    });

    const chartData = Object.keys(monthlyData).sort().map(month => ({
      month,
      revenue: monthlyData[month].revenue,
      expenses: monthlyData[month].expenses,
      profit: monthlyData[month].revenue - monthlyData[month].expenses
    }));

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      chartData
    };
  }

  static async getSalesReport(organizationId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId, status: { not: 'cancelled' } };
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = new Date(startDate);
      if (endDate) where.issuedAt.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true }
    });

    // Group by customer
    const customerSales: Record<string, { name: string; email: string; totalAmount: number; count: number }> = {};
    let totalSales = 0;

    invoices.forEach((inv: any) => {
      const amount = toNumber(inv.amount);
      totalSales += amount;
      
      const cid = inv.customerId;
      if (!customerSales[cid]) {
        customerSales[cid] = {
          name: inv.customer ? inv.customer.name : 'Unknown',
          email: inv.customer && inv.customer.email ? inv.customer.email : '',
          totalAmount: 0,
          count: 0
        };
      }
      customerSales[cid].totalAmount += amount;
      customerSales[cid].count += 1;
    });

    const tableData = Object.values(customerSales).sort((a, b) => b.totalAmount - a.totalAmount);
    const topCustomers = tableData.slice(0, 5).map(c => ({ name: c.name, sales: c.totalAmount }));

    return {
      summary: {
        totalSales,
        totalCustomers: Object.keys(customerSales).length,
        totalInvoices: invoices.length
      },
      chartData: topCustomers,
      tableData
    };
  }

  static async getExpenseReport(organizationId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({ where });

    // Group by category
    const categoryExpenses: Record<string, { category: string; totalAmount: number; count: number }> = {};
    let totalExpenses = 0;

    expenses.forEach((exp: any) => {
      const amount = toNumber(exp.amount);
      totalExpenses += amount;
      
      const cat = exp.category || 'Uncategorized';
      if (!categoryExpenses[cat]) {
        categoryExpenses[cat] = { category: cat, totalAmount: 0, count: 0 };
      }
      categoryExpenses[cat].totalAmount += amount;
      categoryExpenses[cat].count += 1;
    });

    const tableData = Object.values(categoryExpenses).sort((a, b) => b.totalAmount - a.totalAmount);
    
    // For pie chart
    const chartData = tableData.map(c => ({ name: c.category, value: c.totalAmount }));

    return {
      summary: {
        totalExpenses,
        totalCategories: Object.keys(categoryExpenses).length,
        totalTransactions: expenses.length
      },
      chartData,
      tableData
    };
  }
}
