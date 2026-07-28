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

let createdCustomerId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.invoice.deleteMany({});
    await tx.customer.deleteMany({ where: { email: { in: ['create-cust@test.com', 'update-cust@test.com', 'search-cust@test.com'] } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-cust@test.com', 'admin-cust@test.com'] } } });
    await tx.role.deleteMany({ where: { organization: { name: 'Customers Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'Customers Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Customers Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-cust@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const role = await prisma.role.create({
    data: { name: 'admin', isSystemRole: true, organizationId: orgId }
  });

  const user = await prisma.user.create({
    data: { email: 'admin-cust@test.com', password: hashedPw, name: 'Admin User', roleId: role.id, organizationId: orgId, emailVerified: true },
  });

  const permKeys = ['customers.view', 'customers.edit'];
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
    await tx.invoice.deleteMany({});
    await tx.notification.deleteMany({ where: { userId: adminUserId } });
    await tx.customer.deleteMany({ where: { organizationId: orgId } });
    await tx.rolePermission.deleteMany({ where: { role: { organizationId: orgId } } });
    await tx.permission.deleteMany({ where: { key: { in: ['customers.view', 'customers.edit'] } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-cust@test.com', 'admin-cust@test.com'] } } });
    await tx.role.deleteMany({ where: { organizationId: orgId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Customers Integration Tests', () => {
  describe('JWT Protection', () => {
    const routes = [
      { method: 'get', path: '/api/v1/customers' },
      { method: 'post', path: '/api/v1/customers' },
      { method: 'get', path: '/api/v1/customers/some-id' },
      { method: 'patch', path: '/api/v1/customers/some-id' },
      { method: 'delete', path: '/api/v1/customers/some-id' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/v1/customers', () => {
    it('should create a customer successfully', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set(bearerHeader(adminToken))
        .send({ name: 'Test Customer', email: 'create-cust@test.com', phone: '123-456-7890', creditLimit: 5000 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Customer');
      expect(res.body.data.email).toBe('create-cust@test.com');
      expect(res.body.data.creditLimit).toBeDefined();
      createdCustomerId = res.body.data.id;
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set(bearerHeader(adminToken))
        .send({ email: 'nope@test.com' });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate email in same org', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set(bearerHeader(adminToken))
        .send({ name: 'Duplicate', email: 'create-cust@test.com' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/customers', () => {
    it('should list customers with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should search customers by name', async () => {
      const res = await request(app)
        .get('/api/v1/customers?search=Test Customer')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].name).toContain('Test Customer');
    });

    it('should respect page and limit params', async () => {
      const res = await request(app)
        .get('/api/v1/customers?page=1&limit=1')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('should get customer by id', async () => {
      const res = await request(app)
        .get(`/api/v1/customers/${createdCustomerId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdCustomerId);
      expect(res.body.data.name).toBe('Test Customer');
      expect(res.body.data).toHaveProperty('outstanding');
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .get('/api/v1/customers/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/customers/:id', () => {
    it('should update customer successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/${createdCustomerId}`)
        .set(bearerHeader(adminToken))
        .send({ name: 'Updated Customer', phone: '999-999-9999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Customer');
      expect(res.body.data.phone).toBe('999-999-9999');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/${createdCustomerId}`)
        .set(bearerHeader(adminToken))
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .patch('/api/v1/customers/non-existent-id')
        .set(bearerHeader(adminToken))
        .send({ name: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/customers/:id/statement', () => {
    it('should return customer statement', async () => {
      const res = await request(app)
        .get(`/api/v1/customers/${createdCustomerId}/statement`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('customer');
      expect(res.body.data).toHaveProperty('statementDate');
      expect(res.body.data).toHaveProperty('invoices');
      expect(res.body.data).toHaveProperty('totalInvoiced');
      expect(res.body.data).toHaveProperty('totalOutstanding');
      expect(res.body.data.customer.id).toBe(createdCustomerId);
    });

    it('should return 404 for non-existent customer statement', async () => {
      const res = await request(app)
        .get('/api/v1/customers/non-existent-id/statement')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should delete customer successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/customers/${createdCustomerId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted customer', async () => {
      const res = await request(app)
        .delete(`/api/v1/customers/${createdCustomerId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });
});