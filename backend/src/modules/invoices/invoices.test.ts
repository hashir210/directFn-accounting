import request from 'supertest';
import app from '../../app';
import prisma from '../../config/db';
import { generateAccessToken } from '../../utils/tokens';

// Mock the mailer so we don't actually send emails
jest.mock('../../utils/mailer', () => ({
  sendInvoiceEmail: jest.fn().mockResolvedValue(undefined),
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function bearerHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function makeFutureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

// ─── Test State ─────────────────────────────────────────────────────────────

let adminToken: string;
let adminUserId: string;
let orgId: string;
let adminRoleId: string;
let customerId: string;
let productId: string;
let createdInvoiceIds: string[] = [];

// ─── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.invoiceItem.deleteMany({});
    await tx.invoice.deleteMany({});
    await tx.customer.deleteMany({ where: { email: 'inv-test-cust@test.com' } });
    await tx.product.deleteMany({ where: { sku: { startsWith: 'INV-TEST-' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-inv@test.com', 'admin-inv@test.com'] } } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Invoices Test Org', status: 'active', ownerId: '' }
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
    data: { name: 'inv-admin', isSystemRole: true, organizationId: orgId }
  });
  adminRoleId = adminRole.id;

  const adminUser = await prisma.user.create({
    data: { email: 'admin-inv@test.com', password: hashedPw, name: 'Invoices Admin', roleId: adminRoleId, organizationId: orgId, emailVerified: true },
  });
  adminUserId = adminUser.id;

  // Create permissions and assign to role
  const permKeys = ['invoices.view', 'invoices.edit'];
  const perms = await Promise.all(
    permKeys.map(key => prisma.permission.create({ data: { key } }))
  );
  await Promise.all(
    perms.map(p => prisma.rolePermission.create({ data: { roleId: adminRoleId, permissionId: p.id } }))
  );

  adminToken = generateAccessToken({ id: adminUser.id, email: adminUser.email, organizationId: orgId, roleId: adminRoleId });

  // Seed a customer
  const customer = await prisma.customer.create({
    data: { name: 'Invoice Test Corp', email: 'inv-test-cust@test.com', phone: '555-0100', organizationId: orgId, creditLimit: 10000 }
  });
  customerId = customer.id;

  // Seed a product
  const product = await prisma.product.create({
    data: { name: 'Test Widget', sku: 'INV-TEST-WDG', stockQuantity: 100, lowStockThreshold: 10, sellingPrice: 29.99, organizationId: orgId }
  });
  productId = product.id;
});

afterAll(async () => {
  const invoiceIds = createdInvoiceIds;
  const invoiceIdsForItems = createdInvoiceIds;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    if (invoiceIds.length > 0) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    }
    await tx.customer.deleteMany({ where: { email: 'inv-test-cust@test.com' } });
    await tx.product.deleteMany({ where: { sku: { startsWith: 'INV-TEST-' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-inv@test.com', 'admin-inv@test.com'] } } });
    if (orgId) {
      await tx.role.deleteMany({ where: { organizationId: orgId } });
      await tx.organization.deleteMany({ where: { id: orgId } });
    }
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });
  await prisma.$disconnect();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Invoices Integration Tests', () => {
  describe('JWT Protection (all routes blocked without token)', () => {
    const routes = [
      { method: 'get', path: '/api/v1/invoices' },
      { method: 'post', path: '/api/v1/invoices' },
      { method: 'get', path: '/api/v1/invoices/fake-id' },
      { method: 'patch', path: '/api/v1/invoices/fake-id' },
      { method: 'delete', path: '/api/v1/invoices/fake-id' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/v1/invoices (create)', () => {
    it('should create an invoice with line items and compute totals', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          dueAt: makeFutureDate(30).toISOString().split('T')[0],
          items: [
            { description: 'Widget A', quantity: 2, unitPrice: 50, taxRate: 10 },
            { description: 'Widget B', quantity: 1, unitPrice: 100, taxRate: 0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('invoiceNo');
      expect(res.body.data.invoiceNo).toMatch(/^INV-/);
      expect(res.body.data.customerId).toBe(customerId);
      expect(res.body.data.items).toHaveLength(2);

      // Totals: (2*50 = 100) + tax(10) = 110 for item1, (1*100 = 100) + tax(0) = 100 for item2
      // subTotal = 200, taxTotal = 10, amount = 210
      expect(Number(res.body.data.subTotal)).toBe(200);
      expect(Number(res.body.data.taxTotal)).toBe(10);
      expect(Number(res.body.data.amount)).toBe(210);
      expect(res.body.data.status).toBe('pending');

      createdInvoiceIds.push(res.body.data.id);
    });

    it('should create an invoice with productId reference', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          items: [
            { productId, description: 'Test Widget', quantity: 3, unitPrice: 29.99, taxRate: 5 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.items[0].productId).toBe(productId);

      createdInvoiceIds.push(res.body.data.id);
    });

    it('should create an invoice with status "paid" and set paidAt', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          status: 'paid',
          items: [
            { description: 'Quick Sale', quantity: 1, unitPrice: 99.99, taxRate: 0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('paid');
      expect(res.body.data.paidAt).toBeTruthy();

      createdInvoiceIds.push(res.body.data.id);
    });

    it('should create an invoice using customerName (wallet customer)', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerName: 'Walk-in Customer',
          customerEmail: 'walkin@example.com',
          items: [
            { description: 'Over-the-counter', quantity: 1, unitPrice: 25, taxRate: 0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.customer.name).toBe('Walk-in Customer');

      createdInvoiceIds.push(res.body.data.id);

      // Clean up the auto-created customer
      await prisma.customer.deleteMany({ where: { email: 'walkin@example.com' } });
    });

    it('should return 400 when no customerId or customerName', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          items: [
            { description: 'No customer', quantity: 1, unitPrice: 10, taxRate: 0 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when items array is empty', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          items: [],
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid item data (negative quantity)', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          items: [
            { description: 'Bad qty', quantity: -1, unitPrice: 10, taxRate: 0 },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/invoices (list)', () => {
    it('should return paginated list of invoices', async () => {
      const res = await request(app)
        .get('/api/v1/invoices')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.pagination).toHaveProperty('page');
      expect(res.body.data.pagination).toHaveProperty('limit');
      expect(res.body.data.pagination).toHaveProperty('total');
      expect(res.body.data.pagination).toHaveProperty('totalPages');
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status query param', async () => {
      const res = await request(app)
        .get('/api/v1/invoices?status=paid')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data.every((inv: any) => inv.status === 'paid')).toBe(true);
    });

    it('should support pagination (page & limit)', async () => {
      const res = await request(app)
        .get('/api/v1/invoices?page=1&limit=1')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
    });

    it('should search by invoice number', async () => {
      const res = await request(app)
        .get('/api/v1/invoices?search=INV-')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should return 403 without invoices.view permission', async () => {
      // Create a role without invoices.view
      const limitedRole = await prisma.role.create({
        data: { name: 'inv-limited', isSystemRole: false, organizationId: orgId }
      });
      const limitedUser = await prisma.user.create({
        data: { email: 'limited-inv@test.com', password: 'dummy', name: 'Limited', roleId: limitedRole.id, organizationId: orgId, emailVerified: true }
      });
      const limitedToken = generateAccessToken({ id: limitedUser.id, email: limitedUser.email, organizationId: orgId, roleId: limitedRole.id });

      const res = await request(app)
        .get('/api/v1/invoices')
        .set(bearerHeader(limitedToken));

      expect(res.status).toBe(403);

      await prisma.user.deleteMany({ where: { email: 'limited-inv@test.com' } });
      await prisma.role.deleteMany({ where: { id: limitedRole.id } });
    });
  });

  describe('GET /api/v1/invoices/:id (get by id)', () => {
    it('should return invoice by id with items', async () => {
      const firstId = createdInvoiceIds[0];
      const res = await request(app)
        .get(`/api/v1/invoices/${firstId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(firstId);
      expect(res.body.data).toHaveProperty('invoiceNo');
      expect(res.body.data).toHaveProperty('customer');
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app)
        .get('/api/v1/invoices/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it('should return 404 for invoice from another org', async () => {
      // Create a separate org and user
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
      const otherOrg = await prisma.organization.create({
        data: { name: 'Other Org For Invoice', status: 'active', ownerId: adminUserId }
      });
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');

      const otherRole = await prisma.role.create({
        data: { name: 'other-role', isSystemRole: false, organizationId: otherOrg.id }
      });
      const otherUser = await prisma.user.create({
        data: { email: 'other-inv@test.com', password: 'dummy', name: 'Other', roleId: otherRole.id, organizationId: otherOrg.id, emailVerified: true }
      });
      const otherToken = generateAccessToken({ id: otherUser.id, email: otherUser.email, organizationId: otherOrg.id, roleId: otherRole.id });

      // Invoice from the first org
      const firstId = createdInvoiceIds[0];
      const res = await request(app)
        .get(`/api/v1/invoices/${firstId}`)
        .set(bearerHeader(otherToken));

      expect(res.status).toBe(404);

      await prisma.user.deleteMany({ where: { email: 'other-inv@test.com' } });
      await prisma.role.deleteMany({ where: { id: otherRole.id } });
      await prisma.organization.deleteMany({ where: { id: otherOrg.id } });
    });
  });

  describe('PATCH /api/v1/invoices/:id (update status)', () => {
    let pendingInvoiceId: string;

    beforeAll(async () => {
      // Create a fresh pending invoice for update tests
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          status: 'pending',
          items: [
            { description: 'Update Test Item', quantity: 1, unitPrice: 50, taxRate: 0 },
          ],
        });
      pendingInvoiceId = res.body.data.id;
      createdInvoiceIds.push(pendingInvoiceId);
    });

    it('should update invoice status to "paid"', async () => {
      const res = await request(app)
        .patch(`/api/v1/invoices/${pendingInvoiceId}`)
        .set(bearerHeader(adminToken))
        .send({ status: 'paid' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('paid');
      expect(res.body.data.paidAt).toBeTruthy();
    });

    it('should update invoice status to "overdue"', async () => {
      // Create another invoice first
      const createRes = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          items: [
            { description: 'Overdue test', quantity: 1, unitPrice: 30, taxRate: 0 },
          ],
        });
      const invoiceId = createRes.body.data.id;
      createdInvoiceIds.push(invoiceId);

      const res = await request(app)
        .patch(`/api/v1/invoices/${invoiceId}`)
        .set(bearerHeader(adminToken))
        .send({ status: 'overdue' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('overdue');
      expect(res.body.data.paidAt).toBeNull();
    });

    it('should update invoice notes', async () => {
      const res = await request(app)
        .patch(`/api/v1/invoices/${pendingInvoiceId}`)
        .set(bearerHeader(adminToken))
        .send({ notes: 'Updated notes for testing' });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Updated notes for testing');
    });

    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app)
        .patch('/api/v1/invoices/non-existent-id')
        .set(bearerHeader(adminToken))
        .send({ status: 'paid' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid status value', async () => {
      const res = await request(app)
        .patch(`/api/v1/invoices/${pendingInvoiceId}`)
        .set(bearerHeader(adminToken))
        .send({ status: 'invalid-status' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/invoices/:id', () => {
    let invoiceToDeleteId: string;

    beforeAll(async () => {
      // Create a dedicated invoice to delete
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          items: [
            { description: 'To be deleted', quantity: 1, unitPrice: 10, taxRate: 0 },
          ],
        });
      invoiceToDeleteId = res.body.data.id;
    });

    it('should delete an invoice successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/invoices/${invoiceToDeleteId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');

      // Verify it's gone
      const getRes = await request(app)
        .get(`/api/v1/invoices/${invoiceToDeleteId}`)
        .set(bearerHeader(adminToken));
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for already deleted invoice', async () => {
      const res = await request(app)
        .delete(`/api/v1/invoices/${invoiceToDeleteId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app)
        .delete('/api/v1/invoices/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/invoices/:id/pay (record payment)', () => {
    let unpaidInvoiceId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          items: [
            { description: 'Pay via endpoint', quantity: 1, unitPrice: 200, taxRate: 0 },
          ],
        });
      unpaidInvoiceId = res.body.data.id;
      createdInvoiceIds.push(unpaidInvoiceId);
    });

    it('should record payment and mark invoice as paid', async () => {
      const res = await request(app)
        .post(`/api/v1/invoices/${unpaidInvoiceId}/pay`)
        .set(bearerHeader(adminToken))
        .send({ amount: 200 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('paid');
      expect(res.body.data.paidAt).toBeTruthy();
    });

    it('should return 400 when paying an already paid invoice', async () => {
      const res = await request(app)
        .post(`/api/v1/invoices/${unpaidInvoiceId}/pay`)
        .set(bearerHeader(adminToken))
        .send({ amount: 200 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app)
        .post('/api/v1/invoices/non-existent-id/pay')
        .set(bearerHeader(adminToken))
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/invoices/:id/email (email invoice)', () => {
    let invoiceToEmailId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set(bearerHeader(adminToken))
        .send({
          customerId,
          items: [
            { description: 'Email test', quantity: 1, unitPrice: 50, taxRate: 0 },
          ],
        });
      invoiceToEmailId = res.body.data.id;
      createdInvoiceIds.push(invoiceToEmailId);
    });

    it('should email invoice successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/invoices/${invoiceToEmailId}/email`)
        .set(bearerHeader(adminToken))
        .send({ email: 'test-recipient@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app)
        .post('/api/v1/invoices/non-existent-id/email')
        .set(bearerHeader(adminToken))
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post(`/api/v1/invoices/${invoiceToEmailId}/email`)
        .set(bearerHeader(adminToken))
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });
});
