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
let assetAccountId: string;
let expenseAccountId: string;
let revenueAccountId: string;
let journalEntryId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.journalLine.deleteMany({});
    await tx.journalEntry.deleteMany({});
    await tx.account.deleteMany({ where: { organization: { name: 'Journal Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-je@test.com', 'je-admin@test.com', 'je-staff@test.com'] } } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Journal Test Org', status: 'active', ownerId: '' },
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-je@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const adminRole = await prisma.role.create({
    data: { name: 'je-admin', isSystemRole: true, organizationId: orgId },
  });
  adminRoleId = adminRole.id;

  const staffRole = await prisma.role.create({
    data: { name: 'je-staff', isSystemRole: false, organizationId: orgId },
  });
  staffRoleId = staffRole.id;

  const adminUser = await prisma.user.create({
    data: { email: 'je-admin@test.com', password: hashedPw, name: 'JE Admin', roleId: adminRoleId, organizationId: orgId, emailVerified: true },
  });
  const staffUser = await prisma.user.create({
    data: { email: 'je-staff@test.com', password: hashedPw, name: 'JE Staff', roleId: staffRoleId, organizationId: orgId, emailVerified: true },
  });

  adminUserId = adminUser.id;
  staffUserId = staffUser.id;

  const permKeys = ['accounting.view', 'accounting.create', 'accounting.update', 'accounting.delete', 'accounting.approve'];
  const perms = await Promise.all(
    permKeys.map((key) => prisma.permission.create({ data: { key } }))
  );
  await Promise.all(
    perms.map((p) => prisma.rolePermission.create({ data: { roleId: adminRoleId, permissionId: p.id } }))
  );
  await prisma.rolePermission.create({
    data: { roleId: staffRoleId, permissionId: perms.find((p) => p.key === 'accounting.view')!.id },
  });

  adminToken = generateAccessToken({ id: adminUserId, email: adminUser.email, organizationId: orgId, roleId: adminRoleId });
  staffToken = generateAccessToken({ id: staffUserId, email: staffUser.email, organizationId: orgId, roleId: staffRoleId });

  const assetAccount = await prisma.account.create({
    data: { code: '1100', name: 'Test Cash', type: 'ASSET', organizationId: orgId },
  });
  assetAccountId = assetAccount.id;

  const expenseAccount = await prisma.account.create({
    data: { code: '5010', name: 'Test Office Expense', type: 'EXPENSE', organizationId: orgId },
  });
  expenseAccountId = expenseAccount.id;

  const revenueAccount = await prisma.account.create({
    data: { code: '4010', name: 'Test Sales', type: 'INCOME', organizationId: orgId },
  });
  revenueAccountId = revenueAccount.id;
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.journalLine.deleteMany({});
    await tx.journalEntry.deleteMany({});
    await tx.account.deleteMany({ where: { organizationId: orgId } });
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

describe('Journal Entries Integration Tests', () => {
  describe('JWT Protection (all routes blocked without token)', () => {
    const routes = [
      { method: 'get', path: '/api/v1/journal-entries' },
      { method: 'post', path: '/api/v1/journal-entries' },
      { method: 'get', path: '/api/v1/journal-entries/some-id' },
      { method: 'patch', path: '/api/v1/journal-entries/some-id' },
      { method: 'post', path: '/api/v1/journal-entries/some-id/post' },
      { method: 'delete', path: '/api/v1/journal-entries/some-id' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path).send({});
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/v1/journal-entries', () => {
    it('creates a draft journal entry with two lines', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set(bearerHeader(adminToken))
        .send({
          date: '2024-06-15',
          description: 'Test journal entry',
          lines: [
            { accountId: expenseAccountId, debit: 1000, credit: 0, memo: 'Office supplies' },
            { accountId: assetAccountId, debit: 0, credit: 1000, memo: 'Paid from cash' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.lines).toHaveLength(2);
      journalEntryId = res.body.data.id;
    });

    it('rejects entry with single line (needs at least 2)', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set(bearerHeader(adminToken))
        .send({
          date: '2024-06-15',
          description: 'Incomplete entry',
          lines: [
            { accountId: expenseAccountId, debit: 500, credit: 0 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('rejects entry with unbalanced debits and credits', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set(bearerHeader(adminToken))
        .send({
          date: '2024-06-15',
          description: 'Unbalanced entry',
          lines: [
            { accountId: expenseAccountId, debit: 100, credit: 0 },
            { accountId: assetAccountId, debit: 0, credit: 50 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('rejects creation by staff without create permission', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set(bearerHeader(staffToken))
        .send({
          date: '2024-06-15',
          description: 'Staff attempt',
          lines: [
            { accountId: expenseAccountId, debit: 100, credit: 0 },
            { accountId: assetAccountId, debit: 0, credit: 100 },
          ],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/journal-entries', () => {
    it('returns paginated journal entries', async () => {
      const res = await request(app)
        .get('/api/v1/journal-entries')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('respects page and limit params', async () => {
      const res = await request(app)
        .get('/api/v1/journal-entries?page=1&limit=5')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/v1/journal-entries?status=draft')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      res.body.data.data.forEach((e: any) => {
        expect(e.status).toBe('draft');
      });
    });

    it('staff with view permission can list', async () => {
      const res = await request(app)
        .get('/api/v1/journal-entries')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/journal-entries/:id', () => {
    it('returns journal entry by id with lines', async () => {
      const res = await request(app)
        .get(`/api/v1/journal-entries/${journalEntryId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(journalEntryId);
      expect(res.body.data.lines).toHaveLength(2);
    });

    it('returns 404 for non-existent entry', async () => {
      const res = await request(app)
        .get('/api/v1/journal-entries/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/journal-entries/:id', () => {
    it('updates a draft entry description', async () => {
      const res = await request(app)
        .patch(`/api/v1/journal-entries/${journalEntryId}`)
        .set(bearerHeader(adminToken))
        .send({ description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated description');
    });

    it('updates lines on a draft entry', async () => {
      const res = await request(app)
        .patch(`/api/v1/journal-entries/${journalEntryId}`)
        .set(bearerHeader(adminToken))
        .send({
          lines: [
            { accountId: expenseAccountId, debit: 750, credit: 0 },
            { accountId: revenueAccountId, debit: 0, credit: 750 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent entry', async () => {
      const res = await request(app)
        .patch('/api/v1/journal-entries/non-existent-id')
        .set(bearerHeader(adminToken))
        .send({ description: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/journal-entries/:id/post', () => {
    it('posts a draft journal entry', async () => {
      const res = await request(app)
        .post(`/api/v1/journal-entries/${journalEntryId}/post`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('posted');
    });

    it('rejects posting an already posted entry', async () => {
      const res = await request(app)
        .post(`/api/v1/journal-entries/${journalEntryId}/post`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(400);
    });

    it('rejects post by staff without approve permission', async () => {
      const res = await request(app)
        .post(`/api/v1/journal-entries/${journalEntryId}/post`)
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/journal-entries/:id', () => {
    let tempEntryId: string;

    it('deletes a draft journal entry', async () => {
      const createRes = await request(app)
        .post('/api/v1/journal-entries')
        .set(bearerHeader(adminToken))
        .send({
          date: '2024-06-20',
          description: 'To be deleted',
          lines: [
            { accountId: expenseAccountId, debit: 200, credit: 0 },
            { accountId: assetAccountId, debit: 0, credit: 200 },
          ],
        });

      tempEntryId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/journal-entries/${tempEntryId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already deleted entry', async () => {
      const res = await request(app)
        .delete(`/api/v1/journal-entries/${tempEntryId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it('rejects delete by staff without delete permission', async () => {
      const res = await request(app)
        .delete(`/api/v1/journal-entries/${journalEntryId}`)
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(403);
    });
  });
});
