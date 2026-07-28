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

let adminToken: string;
let staffToken: string;
let adminUserId: string;
let staffUserId: string;
let orgId: string;
let adminRoleId: string;
let staffRoleId: string;
let supplierId: string;
let productId: string;
let supplierReturnId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.supplierReturnItem.deleteMany({});
    await tx.supplierReturn.deleteMany({});
    await tx.product.deleteMany({ where: { sku: { startsWith: 'SR-TEST-' } } });
    await tx.supplier.deleteMany({ where: { name: { startsWith: 'Test-Supplier' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-sr@test.com', 'sr-admin@test.com', 'sr-staff@test.com'] } } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'SupplierReturns Test Org', status: 'active', ownerId: '' },
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-sr@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const adminRole = await prisma.role.create({
    data: { name: 'sr-admin', isSystemRole: true, organizationId: orgId },
  });
  adminRoleId = adminRole.id;

  const staffRole = await prisma.role.create({
    data: { name: 'sr-staff', isSystemRole: false, organizationId: orgId },
  });
  staffRoleId = staffRole.id;

  const adminUser = await prisma.user.create({
    data: { email: 'sr-admin@test.com', password: hashedPw, name: 'SR Admin', roleId: adminRoleId, organizationId: orgId, emailVerified: true },
  });
  const staffUser = await prisma.user.create({
    data: { email: 'sr-staff@test.com', password: hashedPw, name: 'SR Staff', roleId: staffRoleId, organizationId: orgId, emailVerified: true },
  });

  adminUserId = adminUser.id;
  staffUserId = staffUser.id;

  const viewPerm = await prisma.permission.create({ data: { key: 'purchases.view' } });
  const editPerm = await prisma.permission.create({ data: { key: 'purchases.edit' } });
  await prisma.rolePermission.create({ data: { roleId: adminRoleId, permissionId: viewPerm.id } });
  await prisma.rolePermission.create({ data: { roleId: adminRoleId, permissionId: editPerm.id } });
  await prisma.rolePermission.create({ data: { roleId: staffRoleId, permissionId: viewPerm.id } });

  adminToken = generateAccessToken({ id: adminUserId, email: adminUser.email, organizationId: orgId, roleId: adminRoleId });
  staffToken = generateAccessToken({ id: staffUserId, email: staffUser.email, organizationId: orgId, roleId: staffRoleId });

  const supplier = await prisma.supplier.create({
    data: { name: 'Test-Supplier-A', contactEmail: 'supplier@test.com', organizationId: orgId },
  });
  supplierId = supplier.id;

  const product = await prisma.product.create({
    data: { name: 'SR Test Widget', sku: 'SR-TEST-WDG', stockQuantity: 50, lowStockThreshold: 5, sellingPrice: 39.99, organizationId: orgId },
  });
  productId = product.id;
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.supplierReturnItem.deleteMany({ where: { supplierReturn: { organizationId: orgId } } });
    await tx.supplierReturn.deleteMany({ where: { organizationId: orgId } });
    await tx.product.deleteMany({ where: { organizationId: orgId } });
    await tx.supplier.deleteMany({ where: { organizationId: orgId } });
    if (adminRoleId && staffRoleId) {
      await tx.rolePermission.deleteMany({ where: { roleId: { in: [adminRoleId, staffRoleId] } } });
    }
    await tx.permission.deleteMany({});
    await tx.user.deleteMany({ where: { organizationId: orgId } });
    await tx.role.deleteMany({ where: { organizationId: orgId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Supplier Returns Integration Tests', () => {
  describe('JWT Protection (all routes blocked without token)', () => {
    const routes = [
      { method: 'get', path: '/api/v1/supplier-returns' },
      { method: 'post', path: '/api/v1/supplier-returns' },
      { method: 'get', path: '/api/v1/supplier-returns/some-id' },
      { method: 'patch', path: '/api/v1/supplier-returns/some-id/process' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path).send({});
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/v1/supplier-returns', () => {
    it('creates a supplier return successfully', async () => {
      const res = await request(app)
        .post('/api/v1/supplier-returns')
        .set(bearerHeader(adminToken))
        .send({
          supplierId,
          items: [
            { productId, quantity: 5, unitPrice: 39.99, reason: 'Damaged goods' },
          ],
          reason: 'Defective batch received',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.items).toHaveLength(1);
      supplierReturnId = res.body.data.id;
    });

    it('creates a return with multiple items', async () => {
      const res = await request(app)
        .post('/api/v1/supplier-returns')
        .set(bearerHeader(adminToken))
        .send({
          supplierId,
          items: [
            { productId, quantity: 2, unitPrice: 39.99 },
            { productId, quantity: 3, unitPrice: 39.99, reason: 'Wrong size' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.items).toHaveLength(2);
    });

    it('rejects return with empty items array', async () => {
      const res = await request(app)
        .post('/api/v1/supplier-returns')
        .set(bearerHeader(adminToken))
        .send({
          supplierId,
          items: [],
        });

      expect(res.status).toBe(400);
    });

    it('rejects return without supplierId', async () => {
      const res = await request(app)
        .post('/api/v1/supplier-returns')
        .set(bearerHeader(adminToken))
        .send({
          items: [{ productId, quantity: 1, unitPrice: 10 }],
        });

      expect(res.status).toBe(400);
    });

    it('rejects return by staff without edit permission', async () => {
      const res = await request(app)
        .post('/api/v1/supplier-returns')
        .set(bearerHeader(staffToken))
        .send({
          supplierId,
          items: [{ productId, quantity: 1, unitPrice: 10 }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/supplier-returns', () => {
    it('returns paginated supplier returns', async () => {
      const res = await request(app)
        .get('/api/v1/supplier-returns')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('respects page and limit params', async () => {
      const res = await request(app)
        .get('/api/v1/supplier-returns?page=1&limit=5')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/v1/supplier-returns?status=Pending')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
    });

    it('staff with view permission can list', async () => {
      const res = await request(app)
        .get('/api/v1/supplier-returns')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/supplier-returns/:id', () => {
    it('returns supplier return by id', async () => {
      const res = await request(app)
        .get(`/api/v1/supplier-returns/${supplierReturnId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(supplierReturnId);
      expect(res.body.data.items).toBeDefined();
    });

    it('returns 404 for non-existent return', async () => {
      const res = await request(app)
        .get('/api/v1/supplier-returns/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/supplier-returns/:id/process', () => {
    it('processes a return with ship action', async () => {
      const res = await request(app)
        .patch(`/api/v1/supplier-returns/${supplierReturnId}/process`)
        .set(bearerHeader(adminToken))
        .send({ action: 'ship' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('processes a return with complete action', async () => {
      const newReturn = await request(app)
        .post('/api/v1/supplier-returns')
        .set(bearerHeader(adminToken))
        .send({
          supplierId,
          items: [{ productId, quantity: 1, unitPrice: 39.99 }],
        });

      const res = await request(app)
        .patch(`/api/v1/supplier-returns/${newReturn.body.data.id}/process`)
        .set(bearerHeader(adminToken))
        .send({ action: 'complete' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid action value', async () => {
      const res = await request(app)
        .patch(`/api/v1/supplier-returns/${supplierReturnId}/process`)
        .set(bearerHeader(adminToken))
        .send({ action: 'invalid_action' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent return', async () => {
      const res = await request(app)
        .patch('/api/v1/supplier-returns/non-existent-id/process')
        .set(bearerHeader(adminToken))
        .send({ action: 'ship' });

      expect(res.status).toBe(404);
    });

    it('rejects process by staff without edit permission', async () => {
      const res = await request(app)
        .patch(`/api/v1/supplier-returns/${supplierReturnId}/process`)
        .set(bearerHeader(staffToken))
        .send({ action: 'ship' });

      expect(res.status).toBe(403);
    });
  });
});
