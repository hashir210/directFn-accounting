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
let discountId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.discount.deleteMany({ where: { organization: { name: 'Discount Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-discount@test.com', 'discount-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { role: { organization: { name: 'Discount Test Org' } } } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { organization: { name: 'Discount Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Discount Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Discount Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-discount@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
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
    data: { email: 'discount-test@test.com', password: hashedPw, name: 'Discount Tester', roleId, organizationId: orgId, emailVerified: true },
  });
  userId = user.id;

  const permKeys = ['sales.view', 'sales.edit'];
  const perms = await Promise.all(permKeys.map(key => prisma.permission.create({ data: { key } })));
  await Promise.all(perms.map(p => prisma.rolePermission.create({ data: { roleId, permissionId: p.id } })));

  token = generateAccessToken({ id: userId, email: user.email, organizationId: orgId, roleId });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.discount.deleteMany({ where: { organizationId: orgId } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-discount@test.com', 'discount-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { id: roleId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Discounts CRUD Integration Tests', () => {
  const basePath = '/api/v1/discounts';

  describe('POST /api/v1/discounts', () => {
    it('should create a percentage discount', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          name: 'Summer Sale 10%',
          type: 'percentage',
          value: 10,
          minOrderAmount: 100,
          maxDiscount: 50,
          isActive: true,
          startDate: new Date().toISOString(),
          endDate: makeFutureDate(30).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.type).toBe('percentage');
      expect(res.body.data.value).toBe(10);
      discountId = res.body.data.id;
    });

    it('should create a fixed discount', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          name: 'Fixed 20 Off',
          type: 'fixed',
          value: 20,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('fixed');
      expect(res.body.data.value).toBe(20);
    });

    it('should fail with missing name', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ type: 'percentage', value: 10 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with invalid type', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ name: 'Bad Discount', type: 'invalid', value: 10 });

      expect(res.status).toBe(400);
    });

    it('should fail with negative value', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ name: 'Negative Discount', type: 'fixed', value: -10 });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post(basePath).send({
        name: 'No Auth', type: 'percentage', value: 5,
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/discounts', () => {
    it('should list all discounts', async () => {
      const res = await request(app)
        .get(basePath)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get(basePath);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/discounts/:id', () => {
    it('should get discount by id', async () => {
      const res = await request(app)
        .get(`${basePath}/${discountId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(discountId);
      expect(res.body.data.name).toBe('Summer Sale 10%');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/discounts/:id', () => {
    it('should update a discount', async () => {
      const res = await request(app)
        .patch(`${basePath}/${discountId}`)
        .set(bearerHeader(token))
        .send({ value: 15, isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value).toBe(15);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`${basePath}/non-existent-id`)
        .set(bearerHeader(token))
        .send({ value: 10 });

      expect(res.status).toBe(404);
    });

    it('should fail with invalid type on update', async () => {
      const res = await request(app)
        .patch(`${basePath}/${discountId}`)
        .set(bearerHeader(token))
        .send({ type: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/discounts/:id', () => {
    it('should delete a discount', async () => {
      const res = await request(app)
        .delete(`${basePath}/${discountId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for deleted discount', async () => {
      const res = await request(app)
        .get(`${basePath}/${discountId}`)
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
