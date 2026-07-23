import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { NotFoundError } from '../../utils/errors';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

// ─── Service ────────────────────────────────────────────────────────────────

export class DashboardService {
  /**
   * Summary: total revenue, total expenses, net profit/loss, and
   * monthly cash-flow array for the current (or given) year.
   */
  /**
   * Summary: total revenue, total expenses, net profit/loss, and
   * monthly cash-flow array for the current (or given) year.
   */
  static async getSummary(organizationId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const orgWhere: any = org?.isPlatform ? {} : { organizationId };

    // Fetch all paid invoices and expenses for the organization (or connected system for platform admin)
    const [paidInvoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          ...orgWhere,
          status: 'paid',
        },
        select: { amount: true, paidAt: true, issuedAt: true },
      }),
      prisma.expense.findMany({
        where: {
          ...orgWhere,
        },
        select: { amount: true, date: true },
      }),
    ]);

    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + toNumber(inv.amount), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + toNumber(exp.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Build 12-month cash flow array in memory
    const monthlyRev = new Array(12).fill(0);
    const monthlyExp = new Array(12).fill(0);

    for (const inv of paidInvoices) {
      const d = inv.paidAt || inv.issuedAt;
      if (d && d.getFullYear() === targetYear) {
        const m = d.getMonth();
        monthlyRev[m] += toNumber(inv.amount);
      }
    }

    for (const exp of expenses) {
      if (exp.date && exp.date.getFullYear() === targetYear) {
        const m = exp.date.getMonth();
        monthlyExp[m] += toNumber(exp.amount);
      }
    }

    const cashFlow = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: monthlyRev[i],
      expenses: monthlyExp[i],
      net: monthlyRev[i] - monthlyExp[i],
    }));

    return {
      year: targetYear,
      totalRevenue,
      totalExpenses,
      netProfit,
      cashFlow,
    };
  }

  /**
   * Bank Balance: sum of all active bank account balances.
   */
  static async getBankBalance(organizationId: string) {
    const accounts = await prisma.bankAccount.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        bankName: true,
        balance: true,
        currency: true,
      },
    });

    const totalBalance = accounts.reduce(
      (acc, a) => acc + toNumber(a.balance),
      0
    );

    return {
      totalBalance,
      accounts: accounts.map((a) => ({
        ...a,
        balance: toNumber(a.balance),
      })),
    };
  }

  /**
   * Pending Payments: paginated list of invoices with status 'pending' or 'overdue'.
   */
  static async getPendingPayments(organizationId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { organizationId, status: { in: ['pending', 'overdue'] } },
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: { organizationId, status: { in: ['pending', 'overdue'] } },
      }),
    ]);

    return {
      data: invoices.map((inv) => ({
        ...inv,
        amount: toNumber(inv.amount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Monthly Sales: revenue grouped by month for a given year.
   */
  static async getMonthlySales(organizationId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: 'paid',
      },
      select: { amount: true, paidAt: true, issuedAt: true },
    });

    const monthlyRevenue = new Array(12).fill(0);
    const monthlyCount = new Array(12).fill(0);

    for (const inv of invoices) {
      const d = inv.paidAt || inv.issuedAt;
      if (d && d.getFullYear() === targetYear) {
        const m = d.getMonth();
        monthlyRevenue[m] += toNumber(inv.amount);
        monthlyCount[m] += 1;
      }
    }

    const data = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: monthlyRevenue[i],
      invoiceCount: monthlyCount[i],
    }));

    return { year: targetYear, data };
  }

  /**
   * Monthly Expenses: expenses grouped by month for a given year.
   */
  static async getMonthlyExpenses(organizationId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const expenses = await prisma.expense.findMany({
      where: {
        organizationId,
      },
      select: { amount: true, date: true },
    });

    const monthlyExpenses = new Array(12).fill(0);
    const monthlyCount = new Array(12).fill(0);

    for (const exp of expenses) {
      if (exp.date && exp.date.getFullYear() === targetYear) {
        const m = exp.date.getMonth();
        monthlyExpenses[m] += toNumber(exp.amount);
        monthlyCount[m] += 1;
      }
    }

    const data = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      expenses: monthlyExpenses[i],
      expenseCount: monthlyCount[i],
    }));

    return { year: targetYear, data };
  }

  /**
   * Top Customers: ranked by total invoiced (paid) amount.
   */
  static async getTopCustomers(organizationId: string, limit: number = 5) {
    const results = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: { organizationId, status: 'paid' },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const customerIds = results.map((r) => r.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true },
    });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    return results.map((r) => ({
      customer: customerMap.get(r.customerId),
      totalRevenue: toNumber(r._sum.amount),
      invoiceCount: r._count.id,
    }));
  }

  /**
   * Low Stock: products where stockQuantity <= lowStockThreshold.
   */
  static async getLowStockProducts(organizationId: string, threshold?: number) {
    const products = await prisma.product.findMany({
      where: { organizationId },
      orderBy: { stockQuantity: 'asc' },
    });

    const lowStockProducts = products.filter((p) =>
      threshold !== undefined
        ? p.stockQuantity <= threshold
        : p.stockQuantity <= p.lowStockThreshold
    );

    return {
      count: lowStockProducts.length,
      products: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        unitPrice: toNumber(p.sellingPrice),
      })),
    };
  }

  /**
   * Notifications: paginated, newest first for a given user.
   */
  static async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark a notification as read for a specific user.
   */
  static async markNotificationRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Create a transaction (Invoice or Expense)
   */
  static async createTransaction(organizationId: string, data: {
    type: string;
    customerName: string;
    amount: number;
    dueDate: string;
    status: string;
  }) {
    if (data.type === 'Invoice') {
      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: { organizationId, name: data.customerName }
      });

      if (!customer) {
        const email = `${data.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`;
        customer = await prisma.customer.create({
          data: {
            organizationId,
            name: data.customerName,
            email,
          }
        });
      }

      const invoiceCount = await prisma.invoice.count({ where: { organizationId } });
      const invoiceNo = `INV-2026-${String(invoiceCount + 1).padStart(4, '0')}`;

      // If the status is Paid, set paidAt to now
      const isPaid = data.status.toLowerCase() === 'paid';
      const paidAt = isPaid ? new Date() : null;

      const invoice = await prisma.invoice.create({
        data: {
          organizationId,
          customerId: customer.id,
          invoiceNo,
          amount: new Decimal(data.amount),
          dueAt: new Date(data.dueDate || new Date()),
          status: data.status.toLowerCase(),
          paidAt,
        }
      });

      return { type: 'Invoice', data: invoice };
    } else if (data.type === 'Expense') {
      const expense = await prisma.expense.create({
        data: {
          organizationId,
          category: 'General',
          description: `Payment to ${data.customerName}`,
          amount: new Decimal(data.amount),
          date: new Date(data.dueDate || new Date()),
        }
      });

      return { type: 'Expense', data: expense };
    }

    throw new Error('Invalid transaction type');
  }
}
