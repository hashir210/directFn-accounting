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
let salesInvoiceId: string;
let salesReturnId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.salesReturnItem.deleteMany({ where: { salesReturn: { organization: { name: 'SR Test Org' } } } });
    await tx.salesReturn.deleteMany({ where: { organization: { name: 'SR Test Org' } } });
    await tx.salesInvoiceItem.deleteMany({ where: { salesInvoice: { organization: { name: 'SR Test Org' } } } });
    await tx.salesInvoice.deleteMany({ where: { organization: { name: 'SR Test Org' } } });
    await tx.salesOrderItem.deleteMany({ where: { salesOrder: { organization: { name: 'SR Test Org' } } } });
    await tx.salesOrder.deleteMany({ where: { organization: { name: 'SR Test Org' } } });
    await tx.customer.deleteMany({ where: { organization: { name: 'SR Test Org' } } });
    await tx.product.deleteMany({ where: { organization: { name: 'SR Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-sr@test.com', 'sr-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { role: { organization: { name: 'SR Test Org' } } } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { organization: { name: 'SR Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'SR Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'SR Test Org', status: 'active', ownerId: '' }
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

  const role = await prisma.role.create({
    data: { name: 'admin', isSystemRole: true, organizationId: orgId }
  });
  roleId = role.id;

  const user = await prisma.user.create({
    data: { email: 'sr-test@test.com', password: hashedPw, name: 'SR Tester', roleId, organizationId: orgId, emailVerified: true },
  });
  userId = user.id;

  const permKeys = ['sales.view', 'sales.edit'];
  const perms = await Promise.all(permKeys.map(key => prisma.permission.create({ data: { key } })));
  await Promise.all(perms.map(p => prisma.rolePermission.create({ data: { roleId, permissionId: p.id } })));

  const customer = await prisma.customer.create({
    data: { name: 'SR Customer', email: 'sr-cust@test.com', organizationId: orgId, creditLimit: 5000 },
  });
  customerId = customer.id;

  const product = await prisma.product.create({
    data: { name: 'SR Widget', sku: 'TEST-SR-WIDGET', stockQuantity: 100, lowStockThreshold: 10, sellingPrice: 29.99, purchasePrice: 12, organizationId: orgId },
  });
  productId = product.id;

  // Create a sales order + invoice so we have a valid salesInvoiceId for returns
  const so = await prisma.salesOrder.create({
    data: {
      orderNo: 'SR-TEST-SO-001', customerId, organizationId: orgId,
      subtotal: 59.98, taxAmount: 3, totalAmount: 62.98, status: 'Confirmed',
      items: { create: [{ productId, quantity: 2, unitPrice: 29.99, lineTotal: 59.98 }] },
    },
  });

  const si = await prisma.salesInvoice.create({
    data: {
      invoiceNo: 'SR-TEST-INV-001', salesOrderId: so.id, organizationId: orgId,
      subtotal: 59.98, taxAmount: 3, totalAmount: 62.98, dueAt: makeFutureDate(30), status: 'Unpaid',
      items: { create: [{ productId, quantity: 2, unitPrice: 29.99, lineTotal: 59.98 }] },
    },
  });
  salesInvoiceId = si.id;

  token = generateAccessToken({ id: userId, email: user.email, organizationId: orgId, roleId });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.salesReturnItem.deleteMany({ where: { salesReturn: { organizationId: orgId } } });
    await tx.salesReturn.deleteMany({ where: { organizationId: orgId } });
    await tx.salesInvoiceItem.deleteMany({ where: { salesInvoice: { organizationId: orgId } } });
    await tx.salesInvoice.deleteMany({ where: { organizationId: orgId } });
    await tx.salesOrderItem.deleteMany({ where: { salesOrder: { organizationId: orgId } } });
    await tx.salesOrder.deleteMany({ where: { organizationId: orgId } });
    await tx.customer.deleteMany({ where: { id: customerId } });
    await tx.product.deleteMany({ where: { id: productId } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-sr@test.com', 'sr-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { id: roleId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Sales Returns CRUD Integration Tests', () => {
  const basePath = '/api/v1/sales-returns';

  describe('POST /api/v1/sales-returns', () => {
    it('should create a sales return', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          salesInvoiceId,
          items: [
            { productId, quantity: 1, unitPrice: 29.99, reason: 'Defective item' },
          ],
          reason: 'Customer reported defect',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('returnNo');
      expect(res.body.data.salesInvoiceId).toBe(salesInvoiceId);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      salesReturnId = res.body.data.id;
    });

    it('should fail with missing salesInvoiceId', async () => {
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
        .send({ salesInvoiceId, items: [] });

      expect(res.status).toBe(400);
    });

    it('should fail with negative quantity', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          salesInvoiceId,
          items: [{ productId, quantity: -1, unitPrice: 10 }],
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post(basePath).send({
        salesInvoiceId, items: [{ productId, quantity: 1, unitPrice: 10 }],
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/sales-returns', () => {
    it('should list sales returns', async () => {
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

  describe('GET /api/v1/sales-returns/:id', () => {
    it('should get sales return by id', async () => {
      const res = await request(app)
        .get(`${basePath}/${salesReturnId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(salesReturnId);
      expect(res.body.data.salesInvoiceId).toBe(salesInvoiceId);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/sales-returns/:id/process', () => {
    it('should approve a sales return', async () => {
      const res = await request(app)
        .patch(`${basePath}/${salesReturnId}/process`)
        .set(bearerHeader(token))
        .send({ action: 'approve' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Approved');
    });

    it('should reject a sales return', async () => {
      // Create another return to reject
      const createRes = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({
          salesInvoiceId,
          items: [{ productId, quantity: 1, unitPrice: 29.99 }],
        });

      const rejectId = createRes.body.data.id;

      const res = await request(app)
        .patch(`${basePath}/${rejectId}/process`)
        .set(bearerHeader(token))
        .send({ action: 'reject' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Rejected');
    });

    it('should fail with invalid action', async () => {
      const res = await request(app)
        .patch(`${basePath}/${salesReturnId}/process`)
        .set(bearerHeader(token))
        .send({ action: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`${basePath}/non-existent-id/process`)
        .set(bearerHeader(token))
        .send({ action: 'approve' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .patch(`${basePath}/${salesReturnId}/process`)
        .send({ action: 'approve' });

      expect(res.status).toBe(401);
    });
  });
});
