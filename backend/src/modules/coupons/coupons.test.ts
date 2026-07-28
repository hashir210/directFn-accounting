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
let couponId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.couponUsage.deleteMany({ where: { coupon: { organization: { name: 'Coupon Test Org' } } } });
    await tx.salesOrder.deleteMany({ where: { organization: { name: 'Coupon Test Org' } } });
    await tx.coupon.deleteMany({ where: { organization: { name: 'Coupon Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-coupon@test.com', 'coupon-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { role: { organization: { name: 'Coupon Test Org' } } } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { organization: { name: 'Coupon Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Coupon Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Coupon Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-coupon@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
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
    data: { email: 'coupon-test@test.com', password: hashedPw, name: 'Coupon Tester', roleId, organizationId: orgId, emailVerified: true },
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
    await tx.couponUsage.deleteMany({ where: { coupon: { organizationId: orgId } } });
    await tx.coupon.deleteMany({ where: { organizationId: orgId } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-coupon@test.com', 'coupon-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { id: roleId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Coupons CRUD Integration Tests', () => {
  const basePath = '/api/v1/coupons';

  describe('POST /api/v1/coupons', () => {
    it('should create a percentage coupon', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          code: 'SAVE10',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 50,
          maxDiscount: 25,
          usageLimit: 100,
          isActive: true,
          startDate: new Date().toISOString(),
          endDate: makeFutureDate(30).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.code).toBe('SAVE10');
      expect(res.body.data.discountType).toBe('percentage');
      couponId = res.body.data.id;
    });

    it('should create a fixed coupon', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          code: 'FLAT20',
          discountType: 'fixed',
          discountValue: 20,
          isActive: true,
          startDate: new Date().toISOString(),
          endDate: makeFutureDate(30).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.discountType).toBe('fixed');
      expect(res.body.data.discountValue).toBe(20);
    });

    it('should fail with missing code', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ discountType: 'percentage', discountValue: 10, startDate: new Date().toISOString(), endDate: makeFutureDate(30).toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with invalid discountType', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          code: 'BADTYPE', discountType: 'invalid', discountValue: 10,
          startDate: new Date().toISOString(), endDate: makeFutureDate(30).toISOString(),
        });

      expect(res.status).toBe(400);
    });

    it('should fail with negative discountValue', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          code: 'NEGATIVE', discountType: 'fixed', discountValue: -10,
          startDate: new Date().toISOString(), endDate: makeFutureDate(30).toISOString(),
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post(basePath).send({
        code: 'NOAUTH', discountType: 'percentage', discountValue: 5,
        startDate: new Date().toISOString(), endDate: makeFutureDate(30).toISOString(),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/coupons', () => {
    it('should list all coupons', async () => {
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

  describe('GET /api/v1/coupons/:id', () => {
    it('should get coupon by id', async () => {
      const res = await request(app)
        .get(`${basePath}/${couponId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(couponId);
      expect(res.body.data.code).toBe('SAVE10');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/coupons/:id', () => {
    it('should update a coupon', async () => {
      const res = await request(app)
        .patch(`${basePath}/${couponId}`)
        .set(bearerHeader(token))
        .send({ discountValue: 15, isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountValue).toBe(15);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`${basePath}/non-existent-id`)
        .set(bearerHeader(token))
        .send({ discountValue: 10 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/coupons/:id', () => {
    it('should delete a coupon', async () => {
      const res = await request(app)
        .delete(`${basePath}/${couponId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for deleted coupon', async () => {
      const res = await request(app)
        .get(`${basePath}/${couponId}`)
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
