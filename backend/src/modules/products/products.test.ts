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
let adminUserId: string;
let orgId: string;

let createdProductId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.stockMovement.deleteMany({});
    await tx.product.deleteMany({ where: { sku: { in: ['TEST-SKU-001', 'TEST-SKU-002', 'TEST-SKU-DUP'] } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-prod@test.com', 'admin-prod@test.com'] } } });
    await tx.role.deleteMany({ where: { organization: { name: 'Products Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Products Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Products Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-prod@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const role = await prisma.role.create({
    data: { name: 'admin', isSystemRole: true, organizationId: orgId }
  });

  const user = await prisma.user.create({
    data: { email: 'admin-prod@test.com', password: hashedPw, name: 'Admin User', roleId: role.id, organizationId: orgId, emailVerified: true },
  });

  const permKeys = ['products.view', 'products.edit'];
  const perms = await Promise.all(
    permKeys.map(key => prisma.permission.create({ data: { key } }))
  );
  await Promise.all(
    perms.map(p => prisma.rolePermission.create({ data: { roleId: role.id, permissionId: p.id } }))
  );

  adminUserId = user.id;
  adminToken = generateAccessToken({ id: user.id, email: user.email, organizationId: orgId, roleId: role.id });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.stockMovement.deleteMany({});
    await tx.product.deleteMany({ where: { organizationId: orgId } });
    await tx.rolePermission.deleteMany({ where: { role: { organizationId: orgId } } });
    await tx.permission.deleteMany({ where: { key: { in: ['products.view', 'products.edit'] } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-prod@test.com', 'admin-prod@test.com'] } } });
    await tx.role.deleteMany({ where: { organizationId: orgId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Products Integration Tests', () => {
  describe('JWT Protection', () => {
    const routes = [
      { method: 'get', path: '/api/v1/products' },
      { method: 'post', path: '/api/v1/products' },
      { method: 'get', path: '/api/v1/products/some-id' },
      { method: 'patch', path: '/api/v1/products/some-id' },
      { method: 'delete', path: '/api/v1/products/some-id' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a product successfully', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set(bearerHeader(adminToken))
        .send({
          name: 'Test Product',
          sku: 'TEST-SKU-001',
          category: 'Electronics',
          unit: 'Piece',
          stockQuantity: 100,
          lowStockThreshold: 10,
          purchasePrice: 25.00,
          sellingPrice: 49.99,
          taxRate: 8.25,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Product');
      expect(res.body.data.sku).toBe('TEST-SKU-001');
      createdProductId = res.body.data.id;
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set(bearerHeader(adminToken))
        .send({ sku: 'TEST-SKU-002', sellingPrice: 10 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing sellingPrice', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set(bearerHeader(adminToken))
        .send({ name: 'No Price', sku: 'TEST-SKU-002' });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate SKU in same org', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set(bearerHeader(adminToken))
        .send({ name: 'Duplicate', sku: 'TEST-SKU-001', sellingPrice: 20 });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should list products with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should search products by name', async () => {
      const res = await request(app)
        .get('/api/v1/products?search=Test Product')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should search products by SKU', async () => {
      const res = await request(app)
        .get('/api/v1/products?search=TEST-SKU-001')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get('/api/v1/products?category=Electronics')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect page and limit params', async () => {
      const res = await request(app)
        .get('/api/v1/products?page=1&limit=1')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should get product by id', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${createdProductId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdProductId);
      expect(res.body.data.name).toBe('Test Product');
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('stockMovements');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/v1/products/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('should update product successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${createdProductId}`)
        .set(bearerHeader(adminToken))
        .send({ name: 'Updated Product', sellingPrice: 59.99, stockQuantity: 80 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Product');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${createdProductId}`)
        .set(bearerHeader(adminToken))
        .send({ sellingPrice: -5 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .patch('/api/v1/products/non-existent-id')
        .set(bearerHeader(adminToken))
        .send({ name: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete product successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${createdProductId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted product', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${createdProductId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });
});