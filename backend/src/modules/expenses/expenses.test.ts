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
let expenseId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.expense.deleteMany({ where: { organization: { name: 'Expense Test Org' } } });
    await tx.journalEntry.deleteMany({ where: { organization: { name: 'Expense Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-expense@test.com', 'expense-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { role: { organization: { name: 'Expense Test Org' } } } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { organization: { name: 'Expense Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Expense Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Expense Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-expense@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const role = await prisma.role.create({
    data: { name: 'admin', isSystemRole: true, organizationId: orgId }
  });
  roleId = role.id;

  const user = await prisma.user.create({
    data: { email: 'expense-test@test.com', password: hashedPw, name: 'Expense Tester', roleId, organizationId: orgId, emailVerified: true },
  });
  userId = user.id;

  const permKeys = ['expenses.view', 'expenses.edit'];
  const perms = await Promise.all(permKeys.map(key => prisma.permission.create({ data: { key } })));
  await Promise.all(perms.map(p => prisma.rolePermission.create({ data: { roleId, permissionId: p.id } })));

  token = generateAccessToken({ id: userId, email: user.email, organizationId: orgId, roleId });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.journalEntry.deleteMany({ where: { organizationId: orgId } });
    await tx.expense.deleteMany({ where: { organizationId: orgId } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-expense@test.com', 'expense-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { id: roleId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Expenses CRUD Integration Tests', () => {
  const basePath = '/api/v1/expenses';

  describe('POST /api/v1/expenses', () => {
    it('should create an expense', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          vendor: 'Office Supplies Co',
          category: 'Office',
          description: 'Printer paper and ink',
          amount: 150.00,
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.vendor).toBe('Office Supplies Co');
      expect(res.body.data.category).toBe('Office');
      expect(res.body.data.amount).toBe(150.00);
      expenseId = res.body.data.id;
    });

    it('should create an expense without optional fields', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          vendor: 'Utility Provider',
          category: 'Utilities',
          amount: 200,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.category).toBe('Utilities');
    });

    it('should fail with missing vendor', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ category: 'Office', amount: 100 });

      expect(res.status).toBe(400);
    });

    it('should fail with negative amount', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ vendor: 'Bad Vendor', category: 'Office', amount: -50 });

      expect(res.status).toBe(400);
    });

    it('should fail with invalid category', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ vendor: 'Test Vendor', category: 'InvalidCategory', amount: 100 });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post(basePath).send({
        vendor: 'No Auth', category: 'Office', amount: 50,
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/expenses', () => {
    it('should list all expenses', async () => {
      const res = await request(app)
        .get(basePath)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get(basePath);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/expenses/:id', () => {
    it('should get expense by id', async () => {
      const res = await request(app)
        .get(`${basePath}/${expenseId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(expenseId);
      expect(res.body.data.vendor).toBe('Office Supplies Co');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/expenses/:id', () => {
    it('should update an expense', async () => {
      const res = await request(app)
        .patch(`${basePath}/${expenseId}`)
        .set(bearerHeader(token))
        .send({ vendor: 'Updated Vendor', amount: 200 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendor).toBe('Updated Vendor');
      expect(res.body.data.amount).toBe(200);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`${basePath}/non-existent-id`)
        .set(bearerHeader(token))
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });

    it('should fail with negative amount on update', async () => {
      const res = await request(app)
        .patch(`${basePath}/${expenseId}`)
        .set(bearerHeader(token))
        .send({ amount: -10 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/expenses/:id', () => {
    it('should delete an expense', async () => {
      const res = await request(app)
        .delete(`${basePath}/${expenseId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for deleted expense', async () => {
      const res = await request(app)
        .get(`${basePath}/${expenseId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .delete(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });
});