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
  await prisma.stockMovement.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.purchaseBill.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.userScreenBlock.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`);

  console.log('[seed]: seeding granular permissions...');
  const modules = ['customers', 'invoices', 'expenses', 'products', 'suppliers', 'inventory', 'reports', 'settings'];
  const actions = ['view', 'create', 'update', 'delete', 'export', 'approve'];

  const permissionKeys: string[] = [
    'dashboard.view',
    'notifications.view',
    'users.manage',
    'roles.manage',
    'screens.manage',
    'platform.view',
    'platform.orgs.manage',
    'platform.users.manage',
  ];

  for (const mod of modules) {
    for (const act of actions) {
      permissionKeys.push(`${mod}.${act}`);
    }
  }

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

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0;`);
  
  const orgId = 'org-finflow';
  const adminId = 'usr-admin';
  
  await prisma.organization.create({
    data: {
      id: orgId,
      name: 'FinFlow HQ',
      ownerId: adminId,
      isPlatform: true,
      maxUsers: 999,
    }
  });

  console.log('[seed]: creating Phase 4 Roles for FinFlow HQ...');
  const adminRole = await prisma.role.create({ data: { organizationId: orgId, name: 'Admin', isSystemRole: true } });
  const accountantRole = await prisma.role.create({ data: { organizationId: orgId, name: 'Accountant', isSystemRole: true } });
  const cashierRole = await prisma.role.create({ data: { organizationId: orgId, name: 'Cashier', isSystemRole: true } });
  const salesRole = await prisma.role.create({ data: { organizationId: orgId, name: 'Sales Person', isSystemRole: true } });
  const storeRole = await prisma.role.create({ data: { organizationId: orgId, name: 'Store Manager', isSystemRole: true } });

  const adminUser = await prisma.user.create({
    data: {
      id: adminId,
      organizationId: orgId,
      roleId: adminRole.id,
      email: 'admin@finflow.com',
      password: hashed,
      name: 'Platform Admin',
      emailVerified: true,
    }
  });

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`);

  console.log('[seed]: assigning permissions for FinFlow HQ...');
  for (const perm of permissions) {
    await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: perm.id } });
  }

  // Create demo users for FinFlow HQ
  await Promise.all([
    prisma.user.create({ data: { organizationId: orgId, roleId: accountantRole.id, email: 'accountant@finflow.com', password: hashed, name: 'Accountant User', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: orgId, roleId: cashierRole.id, email: 'cashier@finflow.com', password: hashed, name: 'Cashier User', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: orgId, roleId: salesRole.id, email: 'sales@finflow.com', password: hashed, name: 'Sales Representative', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: orgId, roleId: storeRole.id, email: 'store@finflow.com', password: hashed, name: 'Warehouse Store Manager', emailVerified: true } }),
  ]);

  // Seed FinFlow HQ Customers & Data
  const [apex, horizon, acme, stark] = await Promise.all([
    prisma.customer.create({ data: { organizationId: orgId, name: 'Apex Global Systems', email: 'billing@apexglobal.com', phone: '+1 202 555 0100' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Horizon Ventures', email: 'finance@horizon.vc' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Acme Corporation', email: 'accounting@acme.com' } }),
    prisma.customer.create({ data: { organizationId: orgId, name: 'Stark Industries', email: 'pepper@stark.com' } }),
  ]);

  const now = new Date();
  const y = now.getFullYear();

  await prisma.invoice.createMany({
    data: [
      { organizationId: orgId, invoiceNo: 'INV-2026-001', customerId: apex.id, amount: 24500, status: 'paid', issuedAt: new Date(y, 0, 2), dueAt: new Date(y, 0, 20), paidAt: new Date(y, 0, 15) },
      { organizationId: orgId, invoiceNo: 'INV-2026-002', customerId: horizon.id, amount: 18700, status: 'overdue', issuedAt: new Date(y, 0, 8), dueAt: new Date(y, 0, 28) },
      { organizationId: orgId, invoiceNo: 'INV-2026-003', customerId: acme.id, amount: 15300, status: 'pending', issuedAt: new Date(y, 1, 11), dueAt: new Date(y, 1, 28) },
      { organizationId: orgId, invoiceNo: 'INV-2026-005', customerId: stark.id, amount: 42000, status: 'paid', issuedAt: new Date(y, 1, 14), dueAt: new Date(y, 1, 28), paidAt: new Date(y, 1, 20) },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { organizationId: orgId, category: 'Hosting', description: 'Direct Hosting AWS', amount: 4800, date: new Date(y, 0, 4) },
      { organizationId: orgId, category: 'Software', description: 'Vercel Enterprise Billing', amount: 1200, date: new Date(y, 1, 10) },
    ],
  });

  await prisma.product.createMany({
    data: [
      { organizationId: orgId, name: 'FinFlow POS Terminal V2', sku: 'FF-POS-V2', category: 'Hardware', stockQuantity: 3, lowStockThreshold: 10, purchasePrice: 220.0, sellingPrice: 349.0 },
      { organizationId: orgId, name: 'Thermal Receipt Paper Roll', sku: 'FF-TRP-80', category: 'Consumables', stockQuantity: 8, lowStockThreshold: 25, purchasePrice: 5.0, sellingPrice: 12.5 },
    ],
  });

  await prisma.bankAccount.createMany({
    data: [
      { organizationId: orgId, name: 'Main Checking', accountNumber: 'FINFLOW-ACC-001', bankName: 'FinBank', balance: 185000, currency: 'USD', isActive: true },
    ],
  });

  // =========================================================================
  // PROVISION & SEED RICH DEMO DATA FOR "DirectFN Trading" TENANT WORKSPACE
  // =========================================================================
  console.log('[seed]: provisioning & seeding DirectFN Trading tenant workspace...');
  const tenantPasswordHash = await bcrypt.hash('Password123!', 10);
  const { org: dfnOrg, user: dfnOwner } = await OrganizationService.createOrganizationWithUser(
    'DirectFN Trading',
    { email: 'owner@directfn.com', passwordHash: tenantPasswordHash, name: 'DirectFN Admin Owner' }
  );

  const dfnOrgId = dfnOrg.id;

  // Query Phase 4 roles auto-created by OrganizationService for DirectFN Trading
  const dfnAdminRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Admin' } });
  const dfnAccountantRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Accountant' } });
  const dfnCashierRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Cashier' } });
  const dfnSalesRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Sales Person' } });
  const dfnStoreRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Store Manager' } });

  // Assign permissions to DirectFN roles
  const accountantPermKeys = ['dashboard.view', 'reports.view', 'notifications.view', 'invoices.view', 'invoices.create', 'invoices.update', 'invoices.export', 'expenses.view', 'expenses.create', 'expenses.export', 'customers.view', 'suppliers.view', 'products.view'];
  const cashierPermKeys = ['dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'customers.view', 'products.view'];
  const salesPermKeys = ['dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'customers.view', 'customers.create', 'products.view'];
  const storePermKeys = ['dashboard.view', 'notifications.view', 'products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.create', 'suppliers.view', 'suppliers.create'];

  if (dfnAccountantRole) { for (const k of accountantPermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnAccountantRole.id, permissionId: p.id } }); } }
  if (dfnCashierRole) { for (const k of cashierPermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnCashierRole.id, permissionId: p.id } }); } }
  if (dfnSalesRole) { for (const k of salesPermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnSalesRole.id, permissionId: p.id } }); } }
  if (dfnStoreRole) { for (const k of storePermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnStoreRole.id, permissionId: p.id } }); } }

  // Add DirectFN Team Users
  await Promise.all([
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnAccountantRole?.id || dfnAdminRole!.id, email: 'accountant@directfn.com', password: tenantPasswordHash, name: 'DirectFN Chief Accountant', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnCashierRole?.id || dfnAdminRole!.id, email: 'cashier@directfn.com', password: tenantPasswordHash, name: 'DirectFN POS Cashier', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnSalesRole?.id || dfnAdminRole!.id, email: 'sales@directfn.com', password: tenantPasswordHash, name: 'DirectFN Senior Sales Exec', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnStoreRole?.id || dfnAdminRole!.id, email: 'store@directfn.com', password: tenantPasswordHash, name: 'DirectFN Warehouse Manager', emailVerified: true } }),
  ]);

  await prisma.organization.update({
    where: { id: dfnOrgId },
    data: {
      planId: proPlan.id,
      contactEmail: 'billing@directfn.com',
      maxUsers: 25,
    },
  });

  await prisma.user.update({
    where: { id: dfnOrg.ownerId },
    data: { emailVerified: true },
  });

  // Seed DirectFN Warehouses
  console.log('[seed]: seeding DirectFN Warehouses & Inventory...');
  const [dlcWarehouse, rdhWarehouse] = await Promise.all([
    prisma.warehouse.create({ data: { organizationId: dfnOrgId, name: 'Dubai Logistics Center', code: 'DLC-01' } }),
    prisma.warehouse.create({ data: { organizationId: dfnOrgId, name: 'Riyadh Distribution Hub', code: 'RDH-02' } }),
  ]);

  // Seed DirectFN Products
  const [p1, p2, p3, p4, p5] = await Promise.all([
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'DirectFN Pro Terminal License V5', sku: 'DFN-TRM-V5', category: 'Software', stockQuantity: 50, lowStockThreshold: 10, purchasePrice: 450.0, sellingPrice: 999.0, imageUrl: 'https://images.unsplash.com/photo-1556742049-0a6792357321' } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'DirectFN Smart POS Touch Terminal', sku: 'DFN-POS-T1', category: 'Hardware', stockQuantity: 6, lowStockThreshold: 15, purchasePrice: 320.0, sellingPrice: 650.0, imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df' } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'Thermal Receipt Paper Roll (Box of 50)', sku: 'DFN-PAP-80', category: 'Consumables', stockQuantity: 120, lowStockThreshold: 30, purchasePrice: 18.0, sellingPrice: 45.0 } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'High-Speed Financial Gateway Router', sku: 'DFN-GW-RTR', category: 'Hardware', stockQuantity: 2, lowStockThreshold: 8, purchasePrice: 850.0, sellingPrice: 1750.0 } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'DirectFN Mobile Trading Dongle', sku: 'DFN-NFC-DGL', category: 'Hardware', stockQuantity: 0, lowStockThreshold: 20, purchasePrice: 25.0, sellingPrice: 69.0 } }),
  ]);

  // Seed DirectFN Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      { organizationId: dfnOrgId, type: 'Stock In', sku: p1.sku, itemName: p1.name, quantity: 50, warehouse: dlcWarehouse.name, status: 'Completed' },
      { organizationId: dfnOrgId, type: 'Stock In', sku: p2.sku, itemName: p2.name, quantity: 15, warehouse: dlcWarehouse.name, status: 'Completed' },
      { organizationId: dfnOrgId, type: 'Transfer', sku: p2.sku, itemName: p2.name, quantity: 5, warehouse: rdhWarehouse.name, status: 'Transferred' },
      { organizationId: dfnOrgId, type: 'Damaged', sku: p4.sku, itemName: p4.name, quantity: 1, warehouse: dlcWarehouse.name, status: 'Written Off' },
    ],
  });

  // Seed DirectFN Customers
  console.log('[seed]: seeding DirectFN Customers...');
  const [dfm, tadawul, adx, qse, ksf] = await Promise.all([
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Dubai Financial Market (DFM)', email: 'settlement@dfm.ae', phone: '+971 4 305 5555', creditLimit: 100000 } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Saudi Tadawul Group', email: 'custody@tadawul.sa', phone: '+966 11 218 9999', creditLimit: 250000 } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Abu Dhabi Securities Exchange (ADX)', email: 'clearing@adx.ae', phone: '+971 2 627 7777', creditLimit: 150000 } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Qatar Stock Exchange (QSE)', email: 'finance@qse.qa', phone: '+974 4445 5555', creditLimit: 120000 } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Kuwait Financial Services Co.', email: 'accounts@kfs.kw', phone: '+965 2224 8888', creditLimit: 80000 } }),
  ]);

  // Seed DirectFN Invoices
  console.log('[seed]: seeding DirectFN Invoices...');
  await prisma.invoice.createMany({
    data: [
      { organizationId: dfnOrgId, invoiceNo: 'DFN-INV-2026-001', customerId: tadawul.id, amount: 48500, status: 'paid', issuedAt: new Date(y, 0, 5), dueAt: new Date(y, 0, 25), paidAt: new Date(y, 0, 20) },
      { organizationId: dfnOrgId, invoiceNo: 'DFN-INV-2026-002', customerId: dfm.id, amount: 32100, status: 'pending', issuedAt: new Date(y, 1, 10), dueAt: new Date(y, 1, 28) },
      { organizationId: dfnOrgId, invoiceNo: 'DFN-INV-2026-003', customerId: adx.id, amount: 14800, status: 'overdue', issuedAt: new Date(y, 0, 15), dueAt: new Date(y, 1, 5) },
      { organizationId: dfnOrgId, invoiceNo: 'DFN-INV-2026-004', customerId: ksf.id, amount: 65000, status: 'paid', issuedAt: new Date(y, 1, 18), dueAt: new Date(y, 2, 10), paidAt: new Date(y, 2, 1) },
      { organizationId: dfnOrgId, invoiceNo: 'DFN-INV-2026-005', customerId: qse.id, amount: 22400, status: 'pending', issuedAt: new Date(y, 2, 2), dueAt: new Date(y, 2, 22) },
    ],
  });

  // Seed DirectFN Suppliers & Purchase Bills
  console.log('[seed]: seeding DirectFN Suppliers & Purchase Bills...');
  const [oracle, cisco, dell, awsEmea] = await Promise.all([
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Oracle Middle East FZ', category: 'Software & DB', contactEmail: 'license@oracle.com', phone: '+971 4 390 0000', paymentTerms: 'Net 30', dueAmount: '18500.00' } }),
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Cisco Systems Gulf', category: 'Networking', contactEmail: 'orders@cisco.com', phone: '+971 4 390 1000', paymentTerms: 'Net 45', dueAmount: '12400.00' } }),
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Dell Technologies FZ-LLC', category: 'Hardware', contactEmail: 'hardware@dell.com', phone: '+971 4 391 2000', paymentTerms: 'Net 30', dueAmount: '0.00' } }),
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Amazon Web Services EMEA', category: 'Cloud Infrastructure', contactEmail: 'aws-billing@amazon.com', phone: '+1 206 266 1000', paymentTerms: 'Net 15', dueAmount: '12500.00' } }),
  ]);

  await prisma.purchaseBill.createMany({
    data: [
      { organizationId: dfnOrgId, supplierId: oracle.id, billNo: 'ORCL-BILL-991', amount: 18500, status: 'Pending', dueDate: new Date(y, 2, 15) },
      { organizationId: dfnOrgId, supplierId: cisco.id, billNo: 'CSCO-BILL-442', amount: 12400, status: 'Pending', dueDate: new Date(y, 2, 28) },
      { organizationId: dfnOrgId, supplierId: dell.id, billNo: 'DELL-BILL-102', amount: 28000, status: 'Paid', dueDate: new Date(y, 1, 10) },
    ],
  });

  // Seed DirectFN Expenses
  console.log('[seed]: seeding DirectFN Expenses...');
  await prisma.expense.createMany({
    data: [
      { organizationId: dfnOrgId, category: 'Hosting', description: 'AWS Financial Cloud High-Availability Cluster', amount: 12500, date: new Date(y, 0, 5) },
      { organizationId: dfnOrgId, category: 'Rent', description: 'Dubai Silicon Oasis Commercial HQ Rent', amount: 8400, date: new Date(y, 0, 15) },
      { organizationId: dfnOrgId, category: 'Salaries', description: 'Sales & Financial Engineering Payroll', amount: 42000, date: new Date(y, 1, 1) },
      { organizationId: dfnOrgId, category: 'Software', description: 'Bloomberg Financial Data Feed Subscription', amount: 6200, date: new Date(y, 1, 12) },
    ],
  });

  // Seed DirectFN Bank Accounts
  console.log('[seed]: seeding DirectFN Bank Accounts...');
  await prisma.bankAccount.createMany({
    data: [
      { organizationId: dfnOrgId, name: 'Emirates NBD Primary Treasury Account', accountNumber: 'ENBD-DFN-9901', bankName: 'Emirates NBD', balance: 340000, currency: 'USD', isActive: true },
      { organizationId: dfnOrgId, name: 'FAB Operations Checking', accountNumber: 'FAB-DFN-4412', bankName: 'First Abu Dhabi Bank', balance: 125000, currency: 'USD', isActive: true },
    ],
  });

  // Seed DirectFN Notifications
  console.log('[seed]: seeding DirectFN Notifications...');
  await prisma.notification.createMany({
    data: [
      { organizationId: dfnOrgId, userId: dfnOwner.id, title: 'Invoice Overdue Alert', message: 'Abu Dhabi Securities Exchange (ADX) invoice DFN-INV-2026-003 ($14,800) is overdue.', type: 'warning' },
      { organizationId: dfnOrgId, userId: dfnOwner.id, title: 'Payment Received', message: 'Saudi Tadawul Group completed payment of $48,500.00 for DFN-INV-2026-001.', type: 'success' },
      { organizationId: dfnOrgId, userId: dfnOwner.id, title: 'Low Stock Alert', message: 'DirectFN Mobile Trading Dongle is out of stock.', type: 'warning' },
    ],
  });

  console.log('[seed]: completed successfully. Full fake data seeded for DirectFN Trading workspace.');
}

main()
  .catch((e) => {
    console.error('[seed]: failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
