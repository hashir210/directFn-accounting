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
let customerId: string;
let productId: string;
let salesOrderId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.salesOrderItem.deleteMany({ where: { salesOrder: { organization: { name: 'SO Test Org' } } } });
    await tx.salesInvoice.deleteMany({ where: { organization: { name: 'SO Test Org' } } });
    await tx.salesOrder.deleteMany({ where: { organization: { name: 'SO Test Org' } } });
    await tx.customer.deleteMany({ where: { organization: { name: 'SO Test Org' } } });
    await tx.product.deleteMany({ where: { organization: { name: 'SO Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-so@test.com', 'so-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { role: { organization: { name: 'SO Test Org' } } } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { organization: { name: 'SO Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'SO Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'SO Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-so@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
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
    data: { email: 'so-test@test.com', password: hashedPw, name: 'SO Tester', roleId, organizationId: orgId, emailVerified: true },
  });
  userId = user.id;

  const permKeys = ['sales.view', 'sales.edit'];
  const perms = await Promise.all(permKeys.map(key => prisma.permission.create({ data: { key } })));
  await Promise.all(perms.map(p => prisma.rolePermission.create({ data: { roleId, permissionId: p.id } })));

  const customer = await prisma.customer.create({
    data: { name: 'SO Customer', email: 'so-cust@test.com', organizationId: orgId, creditLimit: 10000 },
  });
  customerId = customer.id;

  const product = await prisma.product.create({
    data: { name: 'SO Widget', sku: 'TEST-SO-WIDGET', stockQuantity: 50, lowStockThreshold: 5, sellingPrice: 49.99, purchasePrice: 25, organizationId: orgId },
  });
  productId = product.id;

  token = generateAccessToken({ id: userId, email: user.email, organizationId: orgId, roleId });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.salesOrderItem.deleteMany({ where: { salesOrder: { organizationId: orgId } } });
    await tx.salesInvoice.deleteMany({ where: { organizationId: orgId } });
    await tx.salesOrder.deleteMany({ where: { organizationId: orgId } });
    await tx.customer.deleteMany({ where: { id: customerId } });
    await tx.product.deleteMany({ where: { id: productId } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-so@test.com', 'so-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { id: roleId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Sales Orders CRUD Integration Tests', () => {
  const basePath = '/api/v1/sales-orders';

  describe('POST /api/v1/sales-orders', () => {
    it('should create a sales order with line items', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          customerId,
          items: [
            { productId, quantity: 3, unitPrice: 49.99, discount: 0, taxRate: 5 },
          ],
          notes: 'First order',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('orderNo');
      expect(res.body.data.customerId).toBe(customerId);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      salesOrderId = res.body.data.id;
    });

    it('should fail with missing customerId', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ items: [{ productId, quantity: 1, unitPrice: 10 }] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with empty items', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ customerId, items: [] });

      expect(res.status).toBe(400);
    });

    it('should fail with negative quantity', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ customerId, items: [{ productId, quantity: -1, unitPrice: 10 }] });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post(basePath).send({ customerId, items: [{ productId, quantity: 1, unitPrice: 10 }] });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/sales-orders', () => {
    it('should list sales orders', async () => {
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

  describe('GET /api/v1/sales-orders/:id', () => {
    it('should get sales order by id', async () => {
      const res = await request(app)
        .get(`${basePath}/${salesOrderId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(salesOrderId);
      expect(res.body.data.customerId).toBe(customerId);
      expect(res.body.data).toHaveProperty('orderNo');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/sales-orders/:id', () => {
    it('should update a sales order', async () => {
      const res = await request(app)
        .patch(`${basePath}/${salesOrderId}`)
        .set(bearerHeader(token))
        .send({ notes: 'Updated notes' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBe('Updated notes');
    });

    it('should update items on a sales order', async () => {
      const res = await request(app)
        .patch(`${basePath}/${salesOrderId}`)
        .set(bearerHeader(token))
        .send({
          items: [
            { productId, quantity: 5, unitPrice: 45, discount: 0, taxRate: 5 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(5);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`${basePath}/non-existent-id`)
        .set(bearerHeader(token))
        .send({ notes: 'Nowhere' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/sales-orders/:id', () => {
    let deleteOrderId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          customerId,
          items: [{ productId, quantity: 1, unitPrice: 10 }],
        });
      deleteOrderId = res.body.data.id;
    });

    it('should delete a sales order', async () => {
      const res = await request(app)
        .delete(`${basePath}/${deleteOrderId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .delete(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });
});
