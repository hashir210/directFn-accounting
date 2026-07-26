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

    const invoices = await prisma.invoice.findMany({ where: whereInvoice });
    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + toNumber(inv.amount), 0);

    const expenses = await prisma.expense.findMany({ where: whereExpense });
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + toNumber(exp.amount), 0);

    const netProfit = totalRevenue - totalExpenses;

    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    
    invoices.forEach((inv: any) => {
      const month = inv.issuedAt.toISOString().slice(0, 7);
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
      summary: { totalRevenue, totalExpenses, netProfit, profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0 },
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

    const invoices = await prisma.invoice.findMany({ where, include: { customer: true } });

    const customerSales: Record<string, { name: string; email: string; totalAmount: number; count: number }> = {};
    let totalSales = 0;

    invoices.forEach((inv: any) => {
      const amount = toNumber(inv.amount);
      totalSales += amount;
      const cid = inv.customerId;
      if (!customerSales[cid]) {
        customerSales[cid] = { name: inv.customer ? inv.customer.name : 'Unknown', email: inv.customer && inv.customer.email ? inv.customer.email : '', totalAmount: 0, count: 0 };
      }
      customerSales[cid].totalAmount += amount;
      customerSales[cid].count += 1;
    });

    const tableData = Object.values(customerSales).sort((a, b) => b.totalAmount - a.totalAmount);
    const topCustomers = tableData.slice(0, 5).map(c => ({ name: c.name, sales: c.totalAmount }));

    return {
      summary: { totalSales, totalCustomers: Object.keys(customerSales).length, totalInvoices: invoices.length },
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
    const chartData = tableData.map(c => ({ name: c.category, value: c.totalAmount }));

    return {
      summary: { totalExpenses, totalCategories: Object.keys(categoryExpenses).length, totalTransactions: expenses.length },
      chartData,
      tableData
    };
  }

  // --- New Reports ---

  static async getBalanceSheet(organizationId: string) {
    const [bankAccounts, invoices, suppliers] = await Promise.all([
      prisma.bankAccount.findMany({ where: { organizationId, isActive: true } }),
      prisma.invoice.findMany({ where: { organizationId, status: { not: 'paid' } } }),
      prisma.supplier.findMany({ where: { organizationId } }),
    ]);

    const totalCash = bankAccounts.reduce((s, a) => s + toNumber(a.balance), 0);
    const totalReceivables = invoices.reduce((s, i) => s + toNumber(i.amount), 0);
    const totalAssets = totalCash + totalReceivables;

    const totalLiabilities = suppliers.reduce((s, sup) => s + toNumber(sup.dueAmount), 0);
    const equity = totalAssets - totalLiabilities;

    return {
      summary: { totalAssets, totalLiabilities, equity, totalCash, totalReceivables },
      accounts: bankAccounts.map(a => ({ name: a.name, bankName: a.bankName, balance: toNumber(a.balance) })),
    };
  }

  static async getCashFlow(organizationId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const invoiceWhere: any = { organizationId, status: 'paid' };
    const expenseWhere: any = { organizationId };
    if (startDate || endDate) {
      invoiceWhere.paidAt = dateFilter;
      expenseWhere.date = dateFilter;
    }

    const [invoices, expenses, payments] = await Promise.all([
      prisma.invoice.findMany({ where: invoiceWhere }),
      prisma.expense.findMany({ where: expenseWhere }),
      prisma.payment.findMany({ where: { organizationId, status: 'Completed', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
    ]);

    const monthlyData: Record<string, { inflow: number; outflow: number }> = {};

    invoices.forEach((inv: any) => {
      const month = (inv.paidAt || inv.issuedAt).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { inflow: 0, outflow: 0 };
      monthlyData[month].inflow += toNumber(inv.amount);
    });

    expenses.forEach((exp: any) => {
      const month = exp.date.toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { inflow: 0, outflow: 0 };
      monthlyData[month].outflow += toNumber(exp.amount);
    });

    payments.forEach((p: any) => {
      const month = p.createdAt.toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { inflow: 0, outflow: 0 };
      if (p.type === 'Inbound') monthlyData[month].inflow += toNumber(p.amount);
      else monthlyData[month].outflow += toNumber(p.amount);
    });

    const chartData = Object.keys(monthlyData).sort().map(month => ({
      month,
      inflow: monthlyData[month].inflow,
      outflow: monthlyData[month].outflow,
      net: monthlyData[month].inflow - monthlyData[month].outflow,
    }));

    const totalInflow = chartData.reduce((s, m) => s + m.inflow, 0);
    const totalOutflow = chartData.reduce((s, m) => s + m.outflow, 0);

    return {
      summary: { totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow },
      chartData,
    };
  }

  static async getIncomeReport(organizationId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId, status: { not: 'cancelled' } };
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = new Date(startDate);
      if (endDate) where.issuedAt.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({ where, include: { customer: true } });

    const incomeByMonth: Record<string, { month: string; total: number; count: number }> = {};
    let totalIncome = 0;

    invoices.forEach((inv: any) => {
      const month = inv.issuedAt.toISOString().slice(0, 7);
      const amount = toNumber(inv.amount);
      totalIncome += amount;
      if (!incomeByMonth[month]) incomeByMonth[month] = { month, total: 0, count: 0 };
      incomeByMonth[month].total += amount;
      incomeByMonth[month].count += 1;
    });

    const chartData = Object.values(incomeByMonth).sort((a, b) => a.month.localeCompare(b.month));

    return {
      summary: { totalIncome, totalInvoices: invoices.length, averagePerInvoice: invoices.length > 0 ? totalIncome / invoices.length : 0 },
      chartData,
    };
  }

  static async getPurchaseReport(organizationId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const bills = await prisma.purchaseBill.findMany({ where, include: { supplier: true } });

    const supplierData: Record<string, { supplier: string; totalAmount: number; paidAmount: number; count: number }> = {};
    let totalPurchases = 0;

    bills.forEach((bill: any) => {
      const amount = toNumber(bill.amount);
      totalPurchases += amount;
      const sid = bill.supplierId;
      if (!supplierData[sid]) {
        supplierData[sid] = { supplier: bill.supplier.name, totalAmount: 0, paidAmount: 0, count: 0 };
      }
      supplierData[sid].totalAmount += amount;
      supplierData[sid].paidAmount += toNumber(bill.paidAmount);
      supplierData[sid].count += 1;
    });

    const chartData = Object.values(supplierData).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10);

    return {
      summary: { totalPurchases, totalBills: bills.length, outstandingBalance: bills.reduce((s, b) => s + (toNumber(b.amount) - toNumber(b.paidAmount)), 0) },
      chartData,
    };
  }

  static async getCustomerStatementReport(organizationId: string) {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: { invoices: { select: { amount: true, status: true, paidAt: true } } },
    });

    const tableData = customers.map((c) => {
      const totalBilled = c.invoices.reduce((s, i) => s + toNumber(i.amount), 0);
      const totalPaid = c.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + toNumber(i.amount), 0);
      return { name: c.name, email: c.email || '', totalBilled, totalPaid, balance: totalBilled - totalPaid, invoiceCount: c.invoices.length };
    });

    const totalBilled = tableData.reduce((s, r) => s + r.totalBilled, 0);
    const totalPaid = tableData.reduce((s, r) => s + r.totalPaid, 0);
    const totalBalance = tableData.reduce((s, r) => s + r.balance, 0);

    return {
      summary: { totalBilled, totalPaid, totalBalance, totalCustomers: customers.length },
      tableData,
    };
  }

  static async getSupplierStatementReport(organizationId: string) {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId },
      include: { purchaseBills: { select: { amount: true, paidAmount: true, status: true } } },
    });

    const tableData = suppliers.map((s) => {
      const totalBilled = s.purchaseBills.reduce((sum, b) => sum + toNumber(b.amount), 0);
      const totalPaid = s.purchaseBills.reduce((sum, b) => sum + toNumber(b.paidAmount), 0);
      return { name: s.name, category: s.category || '', totalBilled, totalPaid, balance: totalBilled - totalPaid, billCount: s.purchaseBills.length };
    });

    const totalBilled = tableData.reduce((s, r) => s + r.totalBilled, 0);
    const totalPaid = tableData.reduce((s, r) => s + r.totalPaid, 0);
    const totalBalance = tableData.reduce((s, r) => s + r.balance, 0);

    return {
      summary: { totalBilled, totalPaid, totalBalance, totalSuppliers: suppliers.length },
      tableData,
    };
  }

  static async getInventoryReport(organizationId: string) {
    const products = await prisma.product.findMany({ where: { organizationId } });

    let totalValue = 0;
    let totalStock = 0;
    const lowStockItems: { name: string; sku: string; stock: number; threshold: number; value: number }[] = [];

    products.forEach((p) => {
      const qty = p.stockQuantity;
      const price = toNumber(p.purchasePrice);
      const value = qty * price;
      totalValue += value;
      totalStock += qty;
      if (qty <= p.lowStockThreshold) {
        lowStockItems.push({ name: p.name, sku: p.sku, stock: qty, threshold: p.lowStockThreshold, value });
      }
    });

    return {
      summary: { totalValue, totalStock, totalProducts: products.length, lowStockCount: lowStockItems.length, averageValue: products.length > 0 ? totalValue / products.length : 0 },
      lowStockItems,
    };
  }

  static async getTaxReport(organizationId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId, status: { not: 'cancelled' } };
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = new Date(startDate);
      if (endDate) where.issuedAt.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({ where, include: { items: true } });
    const products = await prisma.product.findMany({ where: { organizationId } });

    let totalTaxCollected = 0;
    const taxByProduct: Record<string, { productName: string; taxableAmount: number; taxAmount: number; rate: number }> = {};

    invoices.forEach((inv: any) => {
      totalTaxCollected += toNumber(inv.taxTotal);
      inv.items?.forEach((item: any) => {
        if (item.productId) {
          if (!taxByProduct[item.productId]) {
            taxByProduct[item.productId] = { productName: item.description, taxableAmount: 0, taxAmount: 0, rate: toNumber(item.taxRate) };
          }
          taxByProduct[item.productId].taxableAmount += toNumber(item.total);
          taxByProduct[item.productId].taxAmount += toNumber(item.taxAmount);
        }
      });
    });

    const totalTaxableSales = invoices.reduce((s, i) => s + toNumber(i.subTotal), 0);
    const taxRate = products.length > 0 ? products.reduce((s, p) => s + toNumber(p.taxRate), 0) / products.length : 0;

    const chartData = Object.values(taxByProduct).slice(0, 10);

    return {
      summary: { totalTaxCollected, totalTaxableSales, averageTaxRate: taxRate, taxableInvoices: invoices.filter(i => toNumber(i.taxTotal) > 0).length },
      chartData,
    };
  }
}