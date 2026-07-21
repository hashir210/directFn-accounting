import prisma from '../config/db';
import * as bcrypt from 'bcrypt';
import { OrganizationService } from '../modules/organization/organization.service';

async function main() {
  console.log('[seed]: clearing existing demo data...');
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0;`);
  await prisma.notification.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`);

  console.log('[seed]: seeding permissions...');
  const permissionKeys = [
    'customers.view', 'customers.edit',
    'invoices.view', 'invoices.edit',
    'expenses.view', 'expenses.edit',
    'products.view', 'products.edit',
    'bank_accounts.view', 'bank_accounts.edit',
    'notifications.view',
    'dashboard.view',
    'reports.view',
    'settings.view',
    'users.manage',
    'roles.manage',
    'platform.view',
    'platform.orgs.manage',
    'platform.users.manage',
  ];

  const permissions = [];
  for (const key of permissionKeys) {
    const perm = await prisma.permission.create({ data: { key, description: `Allow ${key.replace('.', ' ')}` } });
    permissions.push(perm);
  }
  const permMap = new Map(permissions.map((p) => [p.key, p]));

  console.log('[seed]: seeding subscription plans...');
  const [freePlan, proPlan, enterprisePlan] = await Promise.all([
    prisma.subscriptionPlan.create({ data: { name: 'Free', description: 'Starter tier — core screens only' } }),
    prisma.subscriptionPlan.create({ data: { name: 'Pro', description: 'Growing business — most screens enabled' } }),
    prisma.subscriptionPlan.create({ data: { name: 'Enterprise', description: 'Full access — custom arrangement' } }),
  ]);

  const hashed = await bcrypt.hash('Password123!', 10);

  // We have to create user first because organization needs an owner, but user needs an organization.
  // Actually, organization.owner is a relation, and user.organization is a relation.
  // We can create the user without organizationId first (wait, organizationId is required on User!).
  // Wait, if organizationId is required on User, we can't create User without Organization!
  // And Organization requires ownerId! 
  // This is a circular dependency. We can solve it by:
  // 1. Create a dummy organization with a dummy ownerId (since ownerId is a string, does it have a foreign key constraint? Yes, owner User @relation).
  // Ah! Prisma doesn't allow inserting if foreign keys fail. 
  // We can create the organization by creating the User inside it using nested writes!
  // BUT the organization's ownerId needs to point to that user. Prisma nested create can't do this easily if both require each other.
  // Oh wait! `ownerId` on `Organization` is required. `organizationId` on `User` is required.
  // But wait! Is `organizationId` required to create a User? Yes.
  // Actually, we can create the User, and provide the nested Organization creation!
  // `prisma.user.create({ data: { ..., ownedOrgs: { create: { name: 'FinFlow Inc.' } } } })`
  // And we can pass `organizationId` from the nested? No, if we do `ownedOrgs: { create: ... }`, it creates the org with `ownerId` set to this user. BUT the User's `organizationId` (which links them to the org as a member) won't be set!
  // We can just update the user right after!
  
  console.log('[seed]: creating organization, roles, and users...');
  
  // Create first user (Admin) and their Organization simultaneously
  // Since User requires organizationId, we can't just create User.
  // Wait! Let's check schema: `organizationId String` on User.
  // Can we create Organization and nest create User?
  // `prisma.organization.create({ data: { name: 'FinFlow Inc.', owner: { create: { email: '...', password: '...', organization: { connect: ??? } } } } })` - impossible.
  // How to break the cycle?
  // We can temporarily disable foreign key checks in MySQL:
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0;`);
  
  const orgId = 'org-finflow';
  const adminId = 'usr-admin';
  
  await prisma.organization.create({
    data: {
      id: orgId,
      name: 'FinFlow Inc.',
      ownerId: adminId,
      isPlatform: true,
    }
  });

  const ownerRole = await prisma.role.create({
    data: { organizationId: orgId, name: 'Owner', isSystemRole: true }
  });
  
  const managerRole = await prisma.role.create({
    data: { organizationId: orgId, name: 'Manager', isSystemRole: true }
  });
  
  const staffRole = await prisma.role.create({
    data: { organizationId: orgId, name: 'Staff', isSystemRole: true }
  });

  const admin = await prisma.user.create({
    data: {
      id: adminId,
      organizationId: orgId,
      roleId: ownerRole.id,
      email: 'admin@finflow.com',
      password: hashed,
      name: 'Admin User',
      emailVerified: true,
    }
  });

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`);

  console.log('[seed]: assigning permissions...');
  // Assign all permissions to Owner
  for (const perm of permissions) {
    await prisma.rolePermission.create({
      data: { roleId: ownerRole.id, permissionId: perm.id }
    });
  }

  // Manager and staff users
  const manager = await prisma.user.create({
    data: { organizationId: orgId, roleId: managerRole.id, email: 'manager@finflow.com', password: hashed, name: 'Manager User', emailVerified: true },
  });
  const staff = await prisma.user.create({
    data: { organizationId: orgId, roleId: staffRole.id, email: 'staff@finflow.com', password: hashed, name: 'Staff User', emailVerified: true },
  });

  console.log('[seed]: assigning Manager & Staff role permissions...');
  const managerPermKeys = [
    'dashboard.view', 'reports.view', 'notifications.view', 'settings.view',
    'customers.view', 'customers.edit',
    'invoices.view', 'invoices.edit',
    'expenses.view', 'expenses.edit',
    'products.view', 'products.edit',
    'bank_accounts.view', 'bank_accounts.edit',
  ];
  const staffPermKeys = [
    'dashboard.view', 'notifications.view',
    'invoices.view', 'expenses.view', 'customers.view', 'products.view',
  ];
  for (const key of managerPermKeys) {
    const perm = permMap.get(key);
    if (perm) await prisma.rolePermission.create({ data: { roleId: managerRole.id, permissionId: perm.id } });
  }
  for (const key of staffPermKeys) {
    const perm = permMap.get(key);
    if (perm) await prisma.rolePermission.create({ data: { roleId: staffRole.id, permissionId: perm.id } });
  }

  console.log('[seed]: creating customers...');
  const [apex, horizon, acme, stark, initech, vercel, aws, hq] = await Promise.all([
    prisma.customer.create({ data: { organizationId: orgId, name: 'Apex Global Systems', email: 'billing@apexglobal.com', phone: '+1 202 555 0100' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Horizon Ventures', email: 'finance@horizon.vc' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Acme Corporation', email: 'accounting@acme.com' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Stark Industries', email: 'pepper@stark.com' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Initech LLC', email: 'ap@initech.com' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Vercel Enterprise', email: 'billing@vercel.com' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Direct Hosting AWS', email: 'bills@aws.com' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'HQ Office Co-working', email: 'rent@hqoffice.com' } }),
  ]);

  const now = new Date();
  const y = now.getFullYear();

  console.log('[seed]: creating invoices...');
  await prisma.invoice.createMany({
    data: [
      { organizationId: orgId, invoiceNo: 'INV-2026-001', customerId: apex.id, amount: 24500, status: 'paid', issuedAt: new Date(y, 0, 2), dueAt: new Date(y, 0, 20), paidAt: new Date(y, 0, 15) },
      { organizationId: orgId, invoiceNo: 'INV-2026-002', customerId: horizon.id, amount: 18700, status: 'overdue', issuedAt: new Date(y, 0, 8), dueAt: new Date(y, 0, 28) },
      { organizationId: orgId, invoiceNo: 'INV-2026-003', customerId: acme.id, amount: 15300, status: 'pending', issuedAt: new Date(y, 1, 11), dueAt: new Date(y, 1, 28) },
      { organizationId: orgId, invoiceNo: 'INV-2026-004', customerId: initech.id, amount: 8900, status: 'pending', issuedAt: new Date(y, 1, 12), dueAt: new Date(y, 1, 28) },
      { organizationId: orgId, invoiceNo: 'INV-2026-005', customerId: stark.id, amount: 42000, status: 'paid', issuedAt: new Date(y, 1, 14), dueAt: new Date(y, 1, 28), paidAt: new Date(y, 1, 20) },
      { organizationId: orgId, invoiceNo: 'INV-2026-006', customerId: apex.id, amount: 9800, status: 'paid', issuedAt: new Date(y, 2, 3), dueAt: new Date(y, 2, 20), paidAt: new Date(y, 2, 10) },
      { organizationId: orgId, invoiceNo: 'INV-2026-007', customerId: acme.id, amount: 6200, status: 'paid', issuedAt: new Date(y, 3, 5), dueAt: new Date(y, 3, 22), paidAt: new Date(y, 3, 12) },
      { organizationId: orgId, invoiceNo: 'INV-2026-008', customerId: horizon.id, amount: 13400, status: 'pending', issuedAt: new Date(y, 4, 2), dueAt: new Date(y, 4, 20) },
      { organizationId: orgId, invoiceNo: 'INV-2026-009', customerId: stark.id, amount: 27500, status: 'paid', issuedAt: new Date(y, 5, 1), dueAt: new Date(y, 5, 20), paidAt: new Date(y, 5, 8) },
      { organizationId: orgId, invoiceNo: 'INV-2026-010', customerId: vercel.id, amount: 1200, status: 'pending', issuedAt: new Date(y, 5, 10), dueAt: new Date(y, 5, 25) },
    ],
  });

  console.log('[seed]: creating expenses...');
  await prisma.expense.createMany({
    data: [
      { organizationId: orgId, category: 'Hosting', description: 'Direct Hosting AWS', amount: 4800, date: new Date(y, 0, 4) },
      { organizationId: orgId, category: 'Software', description: 'Vercel Enterprise Billing', amount: 1200, date: new Date(y, 1, 10) },
      { organizationId: orgId, category: 'Rent', description: 'HQ Office Co-working Rent', amount: 3500, date: new Date(y, 1, 13) },
      { organizationId: orgId, category: 'Salaries', description: 'Engineering payroll', amount: 22000, date: new Date(y, 2, 1) },
      { organizationId: orgId, category: 'Marketing', description: 'Ad campaign', amount: 6400, date: new Date(y, 3, 15) },
      { organizationId: orgId, category: 'Utilities', description: 'Electricity & internet', amount: 1800, date: new Date(y, 4, 2) },
      { organizationId: orgId, category: 'Travel', description: 'Client onsite', amount: 3200, date: new Date(y, 5, 12) },
    ],
  });

  console.log('[seed]: creating products...');
  await prisma.product.createMany({
    data: [
      { organizationId: orgId, name: 'FinFlow POS Terminal V2', sku: 'FF-POS-V2', category: 'Hardware', stockQuantity: 3, lowStockThreshold: 10, unitPrice: 349.0 },
      { organizationId: orgId, name: 'Thermal Receipt Paper Roll', sku: 'FF-TRP-80', category: 'Consumables', stockQuantity: 8, lowStockThreshold: 25, unitPrice: 12.5 },
      { organizationId: orgId, name: 'FinFlow QR Stand Metallic', sku: 'FF-QRS-MET', category: 'Hardware', stockQuantity: 12, lowStockThreshold: 15, unitPrice: 24.0 },
      { organizationId: orgId, name: 'Backup Battery Pack Pro', sku: 'FF-BBP-PRO', category: 'Hardware', stockQuantity: 45, lowStockThreshold: 15, unitPrice: 59.0 },
      { organizationId: orgId, name: 'FinFlow NFC Reader', sku: 'FF-NFC-R1', category: 'Hardware', stockQuantity: 0, lowStockThreshold: 8, unitPrice: 89.0 },
    ],
  });

  console.log('[seed]: creating bank accounts...');
  await prisma.bankAccount.createMany({
    data: [
      { organizationId: orgId, name: 'Main Checking', accountNumber: 'FINFLOW-ACC-001', bankName: 'FinBank', balance: 185000, currency: 'USD', isActive: true },
      { organizationId: orgId, name: 'Savings', accountNumber: 'FINFLOW-ACC-002', bankName: 'FinBank', balance: 63000, currency: 'USD', isActive: true },
    ],
  });

  console.log('[seed]: creating notifications...');
  await prisma.notification.createMany({
    data: [
      { organizationId: orgId, userId: admin.id, title: 'Low Stock Warning', message: 'FinFlow NFC Reader is out of stock.', type: 'warning' },
      { organizationId: orgId, userId: admin.id, title: 'Invoice Paid', message: 'Stark Industries completed payment for INV-2026-009.', type: 'success' },
      { organizationId: orgId, userId: admin.id, title: 'Expense Pending', message: 'Travel expense of $3,200.00 requires approval.', type: 'info' },
      { organizationId: orgId, userId: admin.id, title: 'System Update', message: 'Platform migrated to Core Engine v1.0.', type: 'info' },
    ],
  });

  console.log('[seed]: provisioning a demo tenant organization (DirectFN Trading)...');
  const tenantPasswordHash = await bcrypt.hash('Password123!', 10);
  const { org: tenantOrg } = await OrganizationService.createOrganizationWithUser(
    'DirectFN Trading',
    { email: 'owner@directfn.com', passwordHash: tenantPasswordHash, name: 'DirectFN Owner' }
  );
  // The platform (FinFlow) assigns this tenant a plan and disables some screens
  // (Layer 3). The tenant owner keeps full Layer-2 permissions within the org.
  await prisma.organization.update({
    where: { id: tenantOrg.id },
    data: {
      planId: proPlan.id,
      contactEmail: 'billing@directfn.com',
      maxUsers: 10,
      disabledScreens: JSON.stringify(['integrations', 'inbox', 'past']),
    },
  });
  await prisma.user.update({
    where: { id: tenantOrg.ownerId },
    data: { emailVerified: true },
  });

  console.log('[seed]: done. Demo accounts -> admin@finflow.com / manager@finflow.com / staff@finflow.com (Password123!)');
  console.log('[seed]: tenant demo -> owner@directfn.com (Password123!) on the "DirectFN Trading" org');
}

main()
  .catch((e) => {
    console.error('[seed]: failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
