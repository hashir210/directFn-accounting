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
let accountId: string;

beforeAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.journalLine.deleteMany({});
    await tx.journalEntry.deleteMany({});
    await tx.account.deleteMany({ where: { organization: { name: 'Accounts Test Org' } } });
    await tx.user.deleteMany({ where: { email: { in: ['owner-accts@test.com', 'acct-admin@test.com', 'acct-staff@test.com'] } } });
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  });

  const bcrypt = require('bcrypt');
  const hashedPw = await bcrypt.hash('Password123!', 10);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
  const org = await prisma.organization.create({
    data: { name: 'Accounts Test Org', status: 'active', ownerId: '' },
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
  orgId = org.id;

  const ownerUser = await prisma.user.create({
    data: { email: 'owner-accts@test.com', password: hashedPw, name: 'Org Owner', organizationId: orgId, emailVerified: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: ownerUser.id },
  });

  const adminRole = await prisma.role.create({
    data: { name: 'acct-admin', isSystemRole: true, organizationId: orgId },
  });
  adminRoleId = adminRole.id;

  const staffRole = await prisma.role.create({
    data: { name: 'acct-staff', isSystemRole: false, organizationId: orgId },
  });
  staffRoleId = staffRole.id;

  const adminUser = await prisma.user.create({
    data: { email: 'acct-admin@test.com', password: hashedPw, name: 'Acct Admin', roleId: adminRoleId, organizationId: orgId, emailVerified: true },
  });
  const staffUser = await prisma.user.create({
    data: { email: 'acct-staff@test.com', password: hashedPw, name: 'Acct Staff', roleId: staffRoleId, organizationId: orgId, emailVerified: true },
  });

  adminUserId = adminUser.id;
  staffUserId = staffUser.id;

  const permKeys = ['accounting.view', 'accounting.create', 'accounting.update', 'accounting.delete'];
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

describe('Accounts Integration Tests', () => {
  describe('JWT Protection (all routes blocked without token)', () => {
    const routes = [
      { method: 'get', path: '/api/v1/accounts' },
      { method: 'post', path: '/api/v1/accounts' },
      { method: 'get', path: '/api/v1/accounts/some-id' },
      { method: 'patch', path: '/api/v1/accounts/some-id' },
      { method: 'delete', path: '/api/v1/accounts/some-id' },
    ];

    routes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
        const res = await (request(app) as any)[method](path).send({});
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/v1/accounts', () => {
    it('creates a new account successfully', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(bearerHeader(adminToken))
        .send({
          code: '1100',
          name: 'Test Cash Account',
          type: 'ASSET',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.code).toBe('1100');
      expect(res.body.data.name).toBe('Test Cash Account');
      expect(res.body.data.type).toBe('ASSET');
      accountId = res.body.data.id;
    });

    it('creates an account with parentId', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(bearerHeader(adminToken))
        .send({
          code: '1101',
          name: 'Petty Cash',
          type: 'ASSET',
          parentId: accountId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('rejects duplicate account code', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(bearerHeader(adminToken))
        .send({
          code: '1100',
          name: 'Duplicate Cash',
          type: 'ASSET',
        });

      expect(res.status).toBe(409);
    });

    it('rejects invalid account type', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(bearerHeader(adminToken))
        .send({
          code: '9999',
          name: 'Invalid Type',
          type: 'BOGUS',
        });

      expect(res.status).toBe(400);
    });

    it('rejects creation by staff without create permission', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set(bearerHeader(staffToken))
        .send({
          code: '1200',
          name: 'Staff Account',
          type: 'LIABILITY',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/accounts', () => {
    it('returns list of accounts', async () => {
      const res = await request(app)
        .get('/api/v1/accounts')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('filters by type query param', async () => {
      const res = await request(app)
        .get('/api/v1/accounts?type=ASSET')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      res.body.data.forEach((a: any) => {
        expect(a.type).toBe('ASSET');
      });
    });

    it('staff with view permission can list', async () => {
      const res = await request(app)
        .get('/api/v1/accounts')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(200);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/accounts');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/accounts/:id', () => {
    it('returns account by id', async () => {
      const res = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(accountId);
    });

    it('returns 404 for non-existent account', async () => {
      const res = await request(app)
        .get('/api/v1/accounts/non-existent-id')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/accounts/:id', () => {
    it('updates an account name', async () => {
      const res = await request(app)
        .patch(`/api/v1/accounts/${accountId}`)
        .set(bearerHeader(adminToken))
        .send({ name: 'Updated Cash Account' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Cash Account');
    });

    it('deactivates an account', async () => {
      const res = await request(app)
        .patch(`/api/v1/accounts/${accountId}`)
        .set(bearerHeader(adminToken))
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('returns 404 for non-existent account', async () => {
      const res = await request(app)
        .patch('/api/v1/accounts/non-existent-id')
        .set(bearerHeader(adminToken))
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });

    it('rejects update by staff without update permission', async () => {
      const res = await request(app)
        .patch(`/api/v1/accounts/${accountId}`)
        .set(bearerHeader(staffToken))
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/accounts/:id', () => {
    let deleteAccountId: string;

    it('deletes a newly created account', async () => {
      const createRes = await request(app)
        .post('/api/v1/accounts')
        .set(bearerHeader(adminToken))
        .send({ code: '1999', name: 'Temp Account', type: 'ASSET' });

      deleteAccountId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/accounts/${deleteAccountId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already deleted account', async () => {
      const res = await request(app)
        .delete(`/api/v1/accounts/${deleteAccountId}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it('rejects delete by staff without delete permission', async () => {
      const res = await request(app)
        .delete(`/api/v1/accounts/${accountId}`)
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/accounts/seed', () => {
    it('seeds default chart of accounts', async () => {
      await prisma.account.deleteMany({ where: { organizationId: orgId } });

      const res = await request(app)
        .post('/api/v1/accounts/seed')
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(10);
    });

    it('rejects seed by staff without create permission', async () => {
      const res = await request(app)
        .post('/api/v1/accounts/seed')
        .set(bearerHeader(staffToken));

      expect(res.status).toBe(403);
    });
  });
});
