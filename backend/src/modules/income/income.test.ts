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
let incomeId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.income.deleteMany({ where: { organization: { name: 'Income Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-income@test.com', 'income-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { role: { organization: { name: 'Income Test Org' } } } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { organization: { name: 'Income Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Income Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Income Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-income@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
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
    data: { email: 'income-test@test.com', password: hashedPw, name: 'Income Tester', roleId, organizationId: orgId, emailVerified: true },
  });
  userId = user.id;

  const permKeys = ['income.view', 'income.create', 'income.update', 'income.delete'];
  const perms = await Promise.all(permKeys.map(key => prisma.permission.create({ data: { key } })));
  await Promise.all(perms.map(p => prisma.rolePermission.create({ data: { roleId, permissionId: p.id } })));

  token = generateAccessToken({ id: userId, email: user.email, organizationId: orgId, roleId });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.income.deleteMany({ where: { organizationId: orgId } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-income@test.com', 'income-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { id: roleId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Income CRUD Integration Tests', () => {
  const basePath = '/api/v1/income';
  const payload = {
    category: 'Services',
    description: 'Consulting fees',
    amount: 2500,
    date: new Date().toISOString(),
    referenceNo: 'INV-REF-001',
  };

  describe('POST /api/v1/income', () => {
    it('should create an income record', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.amount).toBe(2500);
      expect(res.body.data.category).toBe('Services');
      incomeId = res.body.data.id;
    });

    it('should fail with missing amount', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ category: 'Sales' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with negative amount', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ ...payload, amount: -100 });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post(basePath).send(payload);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/income', () => {
    it('should list income records', async () => {
      const res = await request(app)
        .get(basePath)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get(basePath);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/income/:id', () => {
    it('should get income by id', async () => {
      const res = await request(app)
        .get(`${basePath}/${incomeId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(incomeId);
      expect(res.body.data.amount).toBe(2500);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/income/:id', () => {
    it('should update an income record', async () => {
      const res = await request(app)
        .patch(`${basePath}/${incomeId}`)
        .set(bearerHeader(token))
        .send({ amount: 3000, description: 'Updated consulting fees' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(3000);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`${basePath}/non-existent-id`)
        .set(bearerHeader(token))
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });

    it('should fail with invalid category', async () => {
      const res = await request(app)
        .patch(`${basePath}/${incomeId}`)
        .set(bearerHeader(token))
        .send({ category: 'InvalidCategory' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/income/:id', () => {
    it('should delete an income record', async () => {
      const res = await request(app)
        .delete(`${basePath}/${incomeId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for deleted record', async () => {
      const res = await request(app)
        .get(`${basePath}/${incomeId}`)
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
