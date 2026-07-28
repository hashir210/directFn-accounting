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
let productId: string;
let movementId: string;
let warehouseId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.stockMovement.deleteMany({});
    await tx.warehouse.deleteMany({ where: { name: { startsWith: 'Test-' } } });
    await tx.product.deleteMany({ where: { sku: { startsWith: 'INV-TEST-' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-inv@test.com', 'inv-admin@test.com', 'inv-staff@test.com'] } } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Inventory Test Org', status: 'active', ownerId: '' },
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-inv@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const adminRole = await prisma.role.create({
    data: { name: 'inv-admin', isSystemRole: true, organizationId: orgId },
  });
  adminRoleId = adminRole.id;

  const staffRole = await prisma.role.create({
    data: { name: 'inv-staff', isSystemRole: false, organizationId: orgId },
  });
  staffRoleId = staffRole.id;

  const adminUser = await prisma.user.create({
    data: { email: 'inv-admin@test.com', password: hashedPw, name: 'Inv Admin', roleId: adminRoleId, organizationId: orgId, emailVerified: true },
  });
  const staffUser = await prisma.user.create({
    data: { email: 'inv-staff@test.com', password: hashedPw, name: 'Inv Staff', roleId: staffRoleId, organizationId: orgId, emailVerified: true },
  });

  adminUserId = adminUser.id;
  staffUserId = staffUser.id;

  const viewPerm = await prisma.permission.create({ data: { key: 'products.view' } });
  const editPerm = await prisma.permission.create({ data: { key: 'products.edit' } });
  await prisma.rolePermission.create({ data: { roleId: adminRoleId, permissionId: viewPerm.id } });
  await prisma.rolePermission.create({ data: { roleId: adminRoleId, permissionId: editPerm.id } });
  await prisma.rolePermission.create({ data: { roleId: staffRoleId, permissionId: viewPerm.id } });

  adminToken = generateAccessToken({ id: adminUserId, email: adminUser.email, organizationId: orgId, roleId: adminRoleId });
  staffToken = generateAccessToken({ id: staffUserId, email: staffUser.email, organizationId: orgId, roleId: staffRoleId });

  const product = await prisma.product.create({
    data: { name: 'Test Widget', sku: 'INV-TEST-WDG', stockQuantity: 100, lowStockThreshold: 10, sellingPrice: 29.99, organizationId: orgId },
  });
  productId = product.id;
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.stockMovement.deleteMany({ where: { organizationId: orgId } });
    await tx.warehouse.deleteMany({ where: { organizationId: orgId } });
    await tx.product.deleteMany({ where: { organizationId: orgId } });
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

describe('Inventory Integration Tests', () => {
  describe('JWT Protection (all routes blocked without token)', () => {
    const routes = [
      { method: 'get', path: '/api/v1/inventory' },
      { method: 'post', path: '/api/v1/inventory' },
      { method: 'get', path: '/api/v1/inventory/warehouses' },
      { method: 'post', path: '/api/v1/inventory/warehouses' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path).send({});
        expect(res.status).toBe(401);
      });
    });
  });

  describe('GET /api/v1/inventory', () => {
    it('returns paginated inventory movements', async () => {
      const res = await request(app)
        .get('/api/v1/inventory')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('returns data for staff user with view permission', async () => {
      const res = await request(app)
        .get('/api/v1/inventory')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('respects page and limit params', async () => {
      const res = await request(app)
        .get('/api/v1/inventory?page=1&limit=5')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /api/v1/inventory', () => {
    it('creates a stock-in movement successfully', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set(bearerHeader(adminToken))
        .send({
          type: 'Stock In',
          sku: 'INV-TEST-WDG',
          itemName: 'Test Widget',
          quantity: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      movementId = res.body.data.id;
    });

    it('creates a stock-out movement successfully', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set(bearerHeader(adminToken))
        .send({
          type: 'Stock Out',
          sku: 'INV-TEST-WDG',
          itemName: 'Test Widget',
          quantity: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('creates a transfer movement with warehouse', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set(bearerHeader(adminToken))
        .send({
          type: 'Transfer',
          sku: 'INV-TEST-WDG',
          itemName: 'Test Widget',
          quantity: 5,
          warehouse: 'Secondary',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid movement type', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set(bearerHeader(adminToken))
        .send({
          type: 'InvalidType',
          sku: 'INV-TEST-WDG',
          itemName: 'Test Widget',
          quantity: 1,
        });

      expect(res.status).toBe(400);
    });

    it('rejects zero quantity', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set(bearerHeader(adminToken))
        .send({
          type: 'Stock In',
          sku: 'INV-TEST-WDG',
          itemName: 'Test Widget',
          quantity: 0,
        });

      expect(res.status).toBe(400);
    });

    it('rejects movement from staff user without edit permission', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set(bearerHeader(staffToken))
        .send({
          type: 'Stock In',
          sku: 'INV-TEST-WDG',
          itemName: 'Test Widget',
          quantity: 1,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/inventory/:id', () => {
    it('updates an existing movement', async () => {
      const res = await request(app)
        .patch(`/api/v1/inventory/${movementId}`)
        .set(bearerHeader(adminToken))
        .send({ quantity: 15 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent movement', async () => {
      const res = await request(app)
        .patch('/api/v1/inventory/non-existent-id')
        .set(bearerHeader(adminToken))
        .send({ quantity: 5 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/inventory/:id', () => {
    it('deletes an existing movement', async () => {
      const res = await request(app)
        .delete(`/api/v1/inventory/${movementId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already deleted movement', async () => {
      const res = await request(app)
        .delete(`/api/v1/inventory/${movementId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/inventory/warehouses', () => {
    it('returns list of warehouses', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/warehouses')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('allows staff with view permission', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/warehouses')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/inventory/warehouses', () => {
    it('creates a new warehouse', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/warehouses')
        .set(bearerHeader(adminToken))
        .send({ name: 'Test-Warehouse-A', code: 'TWH-A' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      warehouseId = res.body.data.id;
    });

    it('rejects duplicate warehouse name', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/warehouses')
        .set(bearerHeader(adminToken))
        .send({ name: 'Test-Warehouse-A' });

      expect(res.status).toBe(409);
    });

    it('rejects warehouse creation by staff without edit permission', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/warehouses')
        .set(bearerHeader(staffToken))
        .send({ name: 'Test-Warehouse-B' });

      expect(res.status).toBe(403);
    });
  });
});
