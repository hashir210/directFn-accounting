import request from 'supertest';
import app from '../../app';
import prisma from '../../config/db';
import { generateAccessToken } from '../../utils/tokens';

function bearerHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function makeFutureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

let token: string;
let userId: string;
let orgId: string;
let roleId: string;

const reportEndpoints = [
  '/api/v1/reports/profit-loss',
  '/api/v1/reports/sales',
  '/api/v1/reports/expenses',
  '/api/v1/reports/balance-sheet',
  '/api/v1/reports/cash-flow',
  '/api/v1/reports/income',
  '/api/v1/reports/purchases',
  '/api/v1/reports/customer-statement',
  '/api/v1/reports/supplier-statement',
  '/api/v1/reports/inventory',
  '/api/v1/reports/tax',
];

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.user.deleteMany({ where: { email: { in: ['owner-reports@test.com', 'reports-test@test.com'] } } });
    await tx.role.deleteMany({ where: { organization: { name: 'Reports Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Reports Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Reports Test Org', status: 'active', ownerId: '' },
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-reports@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const role = await prisma.role.create({
    data: { name: 'reports-admin', isSystemRole: true, organizationId: orgId },
  });
  roleId = role.id;

  const user = await prisma.user.create({
    data: { email: 'reports-test@test.com', password: hashedPw, name: 'Reports User', roleId, organizationId: orgId, emailVerified: true },
  });
  userId = user.id;

  const perm = await prisma.permission.create({ data: { key: 'reports.view' } });
  await prisma.rolePermission.create({ data: { roleId, permissionId: perm.id } });

  token = generateAccessToken({ id: userId, email: user.email, organizationId: orgId, roleId });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.user.deleteMany({ where: { email: { in: ['owner-reports@test.com', 'reports-test@test.com'] } } });
    await tx.role.deleteMany({ where: { organizationId: orgId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Reports Integration Tests', () => {
  describe('JWT Protection (all routes blocked without token)', () => {
    reportEndpoints.forEach((path) => {
      it(`GET ${path} → 401 without token`, async () => {
        const res = await request(app).get(path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('GET /api/v1/reports/profit-loss', () => {
    it('returns profit/loss report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/profit-loss')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('accepts startDate and endDate query params', async () => {
      const res = await request(app)
        .get('/api/v1/reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/reports/sales', () => {
    it('returns sales report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/sales')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/expenses', () => {
    it('returns expense report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/expenses')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/balance-sheet', () => {
    it('returns balance sheet data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/balance-sheet')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/cash-flow', () => {
    it('returns cash flow report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/cash-flow')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/income', () => {
    it('returns income report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/income')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/purchases', () => {
    it('returns purchase report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/purchases')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/customer-statement', () => {
    it('returns customer statement report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/customer-statement')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/supplier-statement', () => {
    it('returns supplier statement report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/supplier-statement')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/inventory', () => {
    it('returns inventory report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/inventory')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/tax', () => {
    it('returns tax report data', async () => {
      const res = await request(app)
        .get('/api/v1/reports/tax')
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});
