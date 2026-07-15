import request from 'supertest';
import app from '../../app';
import prisma from '../../config/db';
import { generateAccessToken } from '../../utils/tokens';

// ─── Helpers ────────────────────────────────────────────────────────────────

function bearerHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function makeFutureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

// ─── Test State ─────────────────────────────────────────────────────────────

let adminToken: string;
let staffToken: string;
let adminUserId: string;
let staffUserId: string;

// Seeded entity IDs we'll reference in assertions
let customerId: string;
let notificationId: string;

// ─── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  // Clean up any leftover test data
  await prisma.notification.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.customer.deleteMany({ where: { email: { in: ['alice@test.com', 'bob@test.com', 'carol@test.com'] } } });
  await prisma.expense.deleteMany({});
  await prisma.product.deleteMany({ where: { sku: { startsWith: 'TEST-' } } });
  await prisma.bankAccount.deleteMany({ where: { accountNumber: { startsWith: 'TEST-' } } });
  await prisma.user.deleteMany({ where: { email: { in: ['admin-dash@test.com', 'staff-dash@test.com'] } } });

  // Create test users (no email verify needed — we're issuing tokens directly)
  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: { email: 'admin-dash@test.com', password: hashedPw, name: 'Admin User', role: 'admin', emailVerified: true },
  });
  const staffUser = await prisma.user.create({
    data: { email: 'staff-dash@test.com', password: hashedPw, name: 'Staff User', role: 'staff', emailVerified: true },
  });

  adminUserId = adminUser.id;
  staffUserId = staffUser.id;

  // Issue JWTs directly (bypass login flow)
  adminToken = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  staffToken = generateAccessToken({ id: staffUser.id, email: staffUser.email, role: staffUser.role });

  // ── Seed Customers ──────────────────────────────────────────────────────
  const [alice, bob, carol] = await Promise.all([
    prisma.customer.create({ data: { name: 'Alice Corp', email: 'alice@test.com', phone: '111-0000' } }),
    prisma.customer.create({ data: { name: 'Bob Ltd', email: 'bob@test.com' } }),
    prisma.customer.create({ data: { name: 'Carol Inc', email: 'carol@test.com' } }),
  ]);
  customerId = alice.id;

  // ── Seed Invoices ───────────────────────────────────────────────────────
  const now = new Date();
  const thisYear = now.getFullYear();

  await prisma.invoice.createMany({
    data: [
      // Alice: two paid invoices this year → highest revenue customer
      { invoiceNo: 'INV-001', customerId: alice.id, amount: 5000, status: 'paid', dueAt: makeFutureDate(-10), paidAt: new Date(thisYear, 0, 15) },
      { invoiceNo: 'INV-002', customerId: alice.id, amount: 3000, status: 'paid', dueAt: makeFutureDate(-5), paidAt: new Date(thisYear, 1, 20) },
      // Bob: one paid, one pending
      { invoiceNo: 'INV-003', customerId: bob.id, amount: 1500, status: 'paid', dueAt: makeFutureDate(-3), paidAt: new Date(thisYear, 2, 10) },
      { invoiceNo: 'INV-004', customerId: bob.id, amount: 800, status: 'pending', dueAt: makeFutureDate(7) },
      // Carol: one overdue
      { invoiceNo: 'INV-005', customerId: carol.id, amount: 1200, status: 'overdue', dueAt: makeFutureDate(-15) },
    ],
  });

  // ── Seed Expenses ───────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      { category: 'Rent', amount: 2000, date: new Date(thisYear, 0, 1) },
      { category: 'Salaries', amount: 5000, date: new Date(thisYear, 1, 1) },
      { category: 'Utilities', amount: 400, date: new Date(thisYear, 2, 1) },
    ],
  });

  // ── Seed Products ───────────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      { name: 'Widget A', sku: 'TEST-WA1', stockQuantity: 3, lowStockThreshold: 10, unitPrice: 49.99 },
      { name: 'Widget B', sku: 'TEST-WB2', stockQuantity: 50, lowStockThreshold: 10, unitPrice: 19.99 },
      { name: 'Widget C', sku: 'TEST-WC3', stockQuantity: 0, lowStockThreshold: 5, unitPrice: 9.99 },
    ],
  });

  // ── Seed Bank Accounts ──────────────────────────────────────────────────
  await prisma.bankAccount.createMany({
    data: [
      { name: 'Main Checking', accountNumber: 'TEST-ACC-001', bankName: 'FinBank', balance: 50000, currency: 'USD' },
      { name: 'Savings', accountNumber: 'TEST-ACC-002', bankName: 'FinBank', balance: 20000, currency: 'USD' },
    ],
  });

  // ── Seed Notifications ──────────────────────────────────────────────────
  const notif = await prisma.notification.create({
    data: { userId: adminUserId, title: 'Low Stock Alert', message: 'Widget A is running low.', type: 'warning' },
  });
  notificationId = notif.id;

  await prisma.notification.createMany({
    data: [
      { userId: adminUserId, title: 'Invoice Paid', message: 'INV-001 has been paid.', type: 'success', read: true },
      { userId: adminUserId, title: 'System Notice', message: 'Scheduled maintenance tonight.', type: 'info' },
    ],
  });
});

afterAll(async () => {
  // Clean up seeded data
  await prisma.notification.deleteMany({ where: { userId: { in: [adminUserId, staffUserId] } } });
  await prisma.invoice.deleteMany({ where: { invoiceNo: { startsWith: 'INV-00' } } });
  await prisma.customer.deleteMany({ where: { email: { in: ['alice@test.com', 'bob@test.com', 'carol@test.com'] } } });
  await prisma.expense.deleteMany({ where: { category: { in: ['Rent', 'Salaries', 'Utilities'] } } });
  await prisma.product.deleteMany({ where: { sku: { startsWith: 'TEST-' } } });
  await prisma.bankAccount.deleteMany({ where: { accountNumber: { startsWith: 'TEST-' } } });
  await prisma.user.deleteMany({ where: { email: { in: ['admin-dash@test.com', 'staff-dash@test.com'] } } });
  await prisma.$disconnect();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Dashboard Integration Tests', () => {
  // ── JWT Protection ─────────────────────────────────────────────────────
  describe('JWT Protection (all routes blocked without token)', () => {
    const routes = [
      { method: 'get', path: '/api/v1/dashboard/summary' },
      { method: 'get', path: '/api/v1/dashboard/bank-balance' },
      { method: 'get', path: '/api/v1/dashboard/pending-payments' },
      { method: 'get', path: '/api/v1/dashboard/monthly-sales' },
      { method: 'get', path: '/api/v1/dashboard/monthly-expenses' },
      { method: 'get', path: '/api/v1/dashboard/top-customers' },
      { method: 'get', path: '/api/v1/dashboard/low-stock' },
      { method: 'get', path: '/api/v1/dashboard/notifications' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  // ── Summary ────────────────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/summary', () => {
    it('returns revenue, expenses, netProfit, and cashFlow array', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const d = res.body.data;
      expect(d).toHaveProperty('totalRevenue');
      expect(d).toHaveProperty('totalExpenses');
      expect(d).toHaveProperty('netProfit');
      expect(Array.isArray(d.cashFlow)).toBe(true);
      expect(d.cashFlow).toHaveLength(12);

      // Seeded paid invoices total = 5000 + 3000 + 1500 = 9500
      expect(d.totalRevenue).toBe(9500);
      // Seeded expenses total = 2000 + 5000 + 400 = 7400
      expect(d.totalExpenses).toBe(7400);
      expect(d.netProfit).toBe(2100);
    });

    it('accepts ?year= query param', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary?year=2020')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.year).toBe(2020);
      // No seeded data for 2020 → zeros
      expect(res.body.data.totalRevenue).toBe(0);
    });

    it('rejects invalid year', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary?year=abc')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(400);
    });
  });

  // ── Bank Balance ───────────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/bank-balance', () => {
    it('returns total balance and individual accounts', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/bank-balance')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
      const d = res.body.data;
      expect(d).toHaveProperty('totalBalance');
      expect(Array.isArray(d.accounts)).toBe(true);
      // Seeded: 50000 + 20000 = 70000
      expect(d.totalBalance).toBe(70000);
    });
  });

  // ── Pending Payments ───────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/pending-payments', () => {
    it('returns pending/overdue invoices with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/pending-payments')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
      const d = res.body.data;
      expect(Array.isArray(d.data)).toBe(true);
      expect(d).toHaveProperty('pagination');
      expect(d.pagination).toHaveProperty('total');
      // Seeded pending + overdue = INV-004 (pending) + INV-005 (overdue) = 2
      expect(d.pagination.total).toBe(2);
    });

    it('respects page and limit params', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/pending-payments?page=1&limit=1')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });

    it('each invoice includes customer info', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/pending-payments')
        .set(bearerHeader(adminToken));

      const invoice = res.body.data.data[0];
      expect(invoice).toHaveProperty('customer');
      expect(invoice.customer).toHaveProperty('name');
    });
  });

  // ── Monthly Sales ──────────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/monthly-sales', () => {
    it('returns 12-month sales array', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/monthly-sales')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(12);
      res.body.data.data.forEach((m: any) => {
        expect(m).toHaveProperty('month');
        expect(m).toHaveProperty('revenue');
        expect(m).toHaveProperty('invoiceCount');
      });
    });

    it('seeded revenue appears in correct months', async () => {
      const year = new Date().getFullYear();
      const res = await request(app)
        .get(`/api/v1/dashboard/monthly-sales?year=${year}`)
        .set(bearerHeader(adminToken));

      const months = res.body.data.data;
      // Jan: 5000, Feb: 3000, Mar: 1500
      expect(months[0].revenue).toBe(5000);
      expect(months[1].revenue).toBe(3000);
      expect(months[2].revenue).toBe(1500);
    });
  });

  // ── Monthly Expenses ───────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/monthly-expenses', () => {
    it('returns 12-month expense array', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/monthly-expenses')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(12);
    });

    it('seeded expenses appear in correct months', async () => {
      const year = new Date().getFullYear();
      const res = await request(app)
        .get(`/api/v1/dashboard/monthly-expenses?year=${year}`)
        .set(bearerHeader(adminToken));

      const months = res.body.data.data;
      // Jan: 2000, Feb: 5000, Mar: 400
      expect(months[0].expenses).toBe(2000);
      expect(months[1].expenses).toBe(5000);
      expect(months[2].expenses).toBe(400);
    });
  });

  // ── Top Customers ──────────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/top-customers', () => {
    it('returns top customers ranked by paid revenue (admin)', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-customers')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(Array.isArray(data)).toBe(true);
      // Alice is top: 5000 + 3000 = 8000
      expect(data[0].customer.name).toBe('Alice Corp');
      expect(data[0].totalRevenue).toBe(8000);
    });

    it('returns top customers (manager)', async () => {
      const managerToken = generateAccessToken({ id: adminUserId, email: 'admin-dash@test.com', role: 'manager' });
      const res = await request(app)
        .get('/api/v1/dashboard/top-customers')
        .set(bearerHeader(managerToken));

      expect(res.status).toBe(200);
    });

    it('blocks staff from top-customers (RBAC)', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-customers')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(403);
    });

    it('respects ?limit= query param', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-customers?limit=1')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ── Low Stock ──────────────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/low-stock', () => {
    it('returns products below their own threshold by default', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/low-stock')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
      const d = res.body.data;
      expect(d).toHaveProperty('count');
      expect(Array.isArray(d.products)).toBe(true);
      // Widget A: qty=3 <= threshold=10 → low stock ✓
      // Widget C: qty=0 <= threshold=5  → low stock ✓
      // Widget B: qty=50 > threshold=10 → NOT low stock
      expect(d.count).toBe(2);
    });

    it('applies ?threshold= override', async () => {
      // With threshold=60, all 3 products should be low stock
      const res = await request(app)
        .get('/api/v1/dashboard/low-stock?threshold=60')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(3);
    });

    it('products are ordered by stock quantity ascending', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/low-stock')
        .set(bearerHeader(adminToken));

      const products = res.body.data.products;
      // Widget C (qty=0) should come before Widget A (qty=3)
      expect(products[0].stockQuantity).toBeLessThanOrEqual(products[1].stockQuantity);
    });
  });

  // ── Notifications ──────────────────────────────────────────────────────
  describe('GET /api/v1/dashboard/notifications', () => {
    it('returns user-scoped notifications with pagination and unread count', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/notifications')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      const d = res.body.data;
      expect(Array.isArray(d.data)).toBe(true);
      expect(d).toHaveProperty('unreadCount');
      expect(d).toHaveProperty('pagination');
      // 3 seeded notifications for admin (1 read, 2 unread)
      expect(d.pagination.total).toBe(3);
      expect(d.unreadCount).toBe(2);
    });

    it('staff user sees only their own notifications (0 for us)', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/notifications')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('respects pagination params', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/notifications?page=1&limit=2')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(2);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });
  });

  // ── Mark Notification Read ─────────────────────────────────────────────
  describe('PATCH /api/v1/dashboard/notifications/:id/read', () => {
    it('marks a notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/dashboard/notifications/${notificationId}/read`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.read).toBe(true);
    });

    it('unread count drops after marking read', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/notifications')
        .set(bearerHeader(adminToken));

      // Started with 2 unread, marked 1 read → 1 unread left
      expect(res.body.data.unreadCount).toBe(1);
    });

    it('returns 404 for a notification belonging to another user', async () => {
      const res = await request(app)
        .patch(`/api/v1/dashboard/notifications/${notificationId}/read`)
        .set(bearerHeader(staffToken)); // staff doesn't own this notification

      expect(res.status).toBe(404);
    });

    it('returns 404 for a non-existent notification ID', async () => {
      const res = await request(app)
        .patch('/api/v1/dashboard/notifications/non-existent-id/read')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });
});
