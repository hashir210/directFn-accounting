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
let supplierId: string;
let productId: string;
let purchaseOrderId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { organization: { name: 'PO Test Org' } } } });
    await tx.purchaseOrder.deleteMany({ where: { organization: { name: 'PO Test Org' } } });
    await tx.supplier.deleteMany({ where: { organization: { name: 'PO Test Org' } } });
    await tx.product.deleteMany({ where: { organization: { name: 'PO Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-po@test.com', 'po-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { role: { organization: { name: 'PO Test Org' } } } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { organization: { name: 'PO Test Org' } } });
    await tx.organization.deleteMany({ where: { name: 'PO Test Org' } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'PO Test Org', status: 'active', ownerId: '' }
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-po@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
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
    data: { email: 'po-test@test.com', password: hashedPw, name: 'PO Tester', roleId, organizationId: orgId, emailVerified: true },
  });
  userId = user.id;

  const permKeys = ['purchases.view', 'purchases.edit'];
  const perms = await Promise.all(permKeys.map(key => prisma.permission.create({ data: { key } })));
  await Promise.all(perms.map(p => prisma.rolePermission.create({ data: { roleId, permissionId: p.id } })));

  const supplier = await prisma.supplier.create({
    data: { name: 'Test Supplier', organizationId: orgId, status: 'Active' },
  });
  supplierId = supplier.id;

  const product = await prisma.product.create({
    data: { name: 'Test Widget', sku: 'TEST-PO-WIDGET', stockQuantity: 100, lowStockThreshold: 10, purchasePrice: 15, sellingPrice: 29.99, organizationId: orgId },
  });
  productId = product.id;

  token = generateAccessToken({ id: userId, email: user.email, organizationId: orgId, roleId });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { organizationId: orgId } } });
    await tx.purchaseOrder.deleteMany({ where: { organizationId: orgId } });
    await tx.supplier.deleteMany({ where: { id: supplierId } });
    await tx.product.deleteMany({ where: { id: productId } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-po@test.com', 'po-test@test.com'] } } });
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({ where: { id: roleId } });
    await tx.organization.deleteMany({ where: { id: orgId } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

describe('Purchase Orders CRUD Integration Tests', () => {
  const basePath = '/api/v1/purchase-orders';

  describe('POST /api/v1/purchase-orders', () => {
    const createPayload = {
      supplierId: '',
      items: [
        { productId: '', quantity: 10, unitPrice: 15, taxRate: 5 },
      ],
      expectedDate: makeFutureDate(14).toISOString(),
      notes: 'Rush order',
    };

    beforeEach(() => {
      createPayload.supplierId = supplierId;
      createPayload.items[0].productId = productId;
    });

    it('should create a purchase order with line items', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('orderNo');
      expect(res.body.data.supplierId).toBe(supplierId);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      purchaseOrderId = res.body.data.id;
    });

    it('should fail with missing supplierId', async () => {
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
        .send({ supplierId, items: [] });

      expect(res.status).toBe(400);
    });

    it('should fail with negative quantity', async () => {
      const res = await request(app)
        .post(basePath)
        .set(bearerHeader(token))
        .send({ supplierId, items: [{ productId, quantity: -1, unitPrice: 10 }] });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post(basePath).send(createPayload);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/purchase-orders', () => {
    it('should list purchase orders', async () => {
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

  describe('GET /api/v1/purchase-orders/:id', () => {
    it('should get purchase order by id', async () => {
      const res = await request(app)
        .get(`${basePath}/${purchaseOrderId}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(purchaseOrderId);
      expect(res.body.data).toHaveProperty('orderNo');
      expect(res.body.data.supplierId).toBe(supplierId);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${basePath}/non-existent-id`)
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/purchase-orders/:id', () => {
    it('should update a purchase order', async () => {
      const res = await request(app)
        .patch(`${basePath}/${purchaseOrderId}`)
        .set(bearerHeader(token))
        .send({ notes: 'Updated notes', expectedDate: makeFutureDate(21).toISOString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBe('Updated notes');
    });

    it('should update items on a purchase order', async () => {
      const res = await request(app)
        .patch(`${basePath}/${purchaseOrderId}`)
        .set(bearerHeader(token))
        .send({
          items: [
            { productId, quantity: 20, unitPrice: 14, taxRate: 5 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(20);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`${basePath}/non-existent-id`)
        .set(bearerHeader(token))
        .send({ notes: 'Nowhere' });

      expect(res.status).toBe(404);
    });
  });
});
