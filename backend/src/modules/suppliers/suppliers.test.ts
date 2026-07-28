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

let createdSupplierId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.supplierPayment.deleteMany({});
    await tx.purchaseBill.deleteMany({});
    await tx.supplier.deleteMany({ where: { name: { in: ['Test Supplier', 'Updated Supplier', 'Duplicate Supplier'] } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-supp@test.com', 'admin-supp@test.com'] } } });
    await tx.role.deleteMany({ where: { organization: { name: 'Suppliers Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Suppliers Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Suppliers Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-supp@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const role = await prisma.role.create({
    data: { name: 'admin', isSystemRole: true, organizationId: orgId }
  });

  const user = await prisma.user.create({
    data: { email: 'admin-supp@test.com', password: hashedPw, name: 'Admin User', roleId: role.id, organizationId: orgId, emailVerified: true },
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
    await tx.supplierPayment.deleteMany({});
    await tx.purchaseBill.deleteMany({});
    await tx.supplier.deleteMany({ where: { organizationId: orgId } });
    await tx.rolePermission.deleteMany({ where: { role: { organizationId: orgId } } });
    await tx.permission.deleteMany({ where: { key: { in: ['products.view', 'products.edit'] } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-supp@test.com', 'admin-supp@test.com'] } } });
    await tx.role.deleteMany({ where: { organizationId: orgId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Suppliers Integration Tests', () => {
  describe('JWT Protection', () => {
    const routes = [
      { method: 'get', path: '/api/v1/suppliers' },
      { method: 'post', path: '/api/v1/suppliers' },
      { method: 'get', path: '/api/v1/suppliers/some-id' },
      { method: 'patch', path: '/api/v1/suppliers/some-id' },
      { method: 'delete', path: '/api/v1/suppliers/some-id' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/v1/suppliers', () => {
    it('should create a supplier successfully', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers')
        .set(bearerHeader(adminToken))
        .send({ name: 'Test Supplier', contactEmail: 'supplier@test.com', phone: '555-0000', paymentTerms: 'Net 60' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Supplier');
      expect(res.body.data.contactEmail).toBe('supplier@test.com');
      expect(res.body.data.paymentTerms).toBe('Net 60');
      createdSupplierId = res.body.data.id;
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers')
        .set(bearerHeader(adminToken))
        .send({ contactEmail: 'nope@test.com' });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate name in same org', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers')
        .set(bearerHeader(adminToken))
        .send({ name: 'Test Supplier' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/suppliers', () => {
    it('should list suppliers with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should search suppliers by name', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers?search=Test Supplier')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect page and limit params', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers?page=1&limit=1')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/suppliers/:id', () => {
    it('should get supplier by id', async () => {
      const res = await request(app)
        .get(`/api/v1/suppliers/${createdSupplierId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdSupplierId);
      expect(res.body.data.name).toBe('Test Supplier');
      expect(res.body.data).toHaveProperty('dueAmount');
    });

    it('should return 404 for non-existent supplier', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/suppliers/:id', () => {
    it('should update supplier successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/suppliers/${createdSupplierId}`)
        .set(bearerHeader(adminToken))
        .send({ name: 'Updated Supplier', paymentTerms: 'Net 30' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Supplier');
      expect(res.body.data.paymentTerms).toBe('Net 30');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .patch(`/api/v1/suppliers/${createdSupplierId}`)
        .set(bearerHeader(adminToken))
        .send({ contactEmail: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent supplier', async () => {
      const res = await request(app)
        .patch('/api/v1/suppliers/non-existent-id')
        .set(bearerHeader(adminToken))
        .send({ name: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/suppliers/:id', () => {
    it('should delete supplier successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/suppliers/${createdSupplierId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted supplier', async () => {
      const res = await request(app)
        .delete(`/api/v1/suppliers/${createdSupplierId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });
});