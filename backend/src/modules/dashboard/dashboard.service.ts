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
  static async getSummary(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear + 1, 0, 1);

    // Total revenue: sum of paid invoices this year
    const revenueResult = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        paidAt: { gte: yearStart, lt: yearEnd },
      },
    });
    const totalRevenue = toNumber(revenueResult._sum.amount);

    // Total expenses this year
    const expenseResult = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: yearStart, lt: yearEnd } },
    });
    const totalExpenses = toNumber(expenseResult._sum.amount);

    const netProfit = totalRevenue - totalExpenses;

    // Monthly cash flow: revenue - expenses per month
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const cashFlow = await Promise.all(
      months.map(async (month) => {
        const { start, end } = monthRange(targetYear, month);

        const [rev, exp] = await Promise.all([
          prisma.invoice.aggregate({
            _sum: { amount: true },
            where: { status: 'paid', paidAt: { gte: start, lt: end } },
          }),
          prisma.expense.aggregate({
            _sum: { amount: true },
            where: { date: { gte: start, lt: end } },
          }),
        ]);

        return {
          month,
          revenue: toNumber(rev._sum.amount),
          expenses: toNumber(exp._sum.amount),
          net: toNumber(rev._sum.amount) - toNumber(exp._sum.amount),
        };
      })
    );

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
  static async getBankBalance() {
    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
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
  static async getPendingPayments(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: { in: ['pending', 'overdue'] } },
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: { status: { in: ['pending', 'overdue'] } },
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
  static async getMonthlySales(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const data = await Promise.all(
      months.map(async (month) => {
        const { start, end } = monthRange(targetYear, month);
        const result = await prisma.invoice.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { status: 'paid', paidAt: { gte: start, lt: end } },
        });
        return {
          month,
          revenue: toNumber(result._sum.amount),
          invoiceCount: result._count.id,
        };
      })
    );

    return { year: targetYear, data };
  }

  /**
   * Monthly Expenses: expenses grouped by month for a given year.
   */
  static async getMonthlyExpenses(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const data = await Promise.all(
      months.map(async (month) => {
        const { start, end } = monthRange(targetYear, month);
        const result = await prisma.expense.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { date: { gte: start, lt: end } },
        });
        return {
          month,
          expenses: toNumber(result._sum.amount),
          expenseCount: result._count.id,
        };
      })
    );

    return { year: targetYear, data };
  }

  /**
   * Top Customers: ranked by total invoiced (paid) amount.
   */
  static async getTopCustomers(limit: number = 5) {
    const results = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: { status: 'paid' },
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
  static async getLowStockProducts(threshold?: number) {
    if (threshold !== undefined) {
      // Filter by an explicit numeric threshold across all products
      const products = await prisma.product.findMany({
        where: { stockQuantity: { lte: threshold } },
        orderBy: { stockQuantity: 'asc' },
      });
      return {
        count: products.length,
        products: products.map((p) => ({
          ...p,
          unitPrice: toNumber(p.unitPrice),
        })),
      };
    }

    // Default: compare each product's quantity against its own lowStockThreshold
    const products = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        sku: string;
        category: string | null;
        stockQuantity: number;
        lowStockThreshold: number;
        unitPrice: string;
      }[]
    >`
      SELECT id, name, sku, category, stockQuantity, lowStockThreshold, unitPrice
      FROM Product
      WHERE stockQuantity <= lowStockThreshold
      ORDER BY stockQuantity ASC
    `;

    return {
      count: products.length,
      products: products.map((p) => ({
        ...p,
        unitPrice: Number(p.unitPrice),
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
}
