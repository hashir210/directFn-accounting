import prisma from '../config/db';
import * as bcrypt from 'bcrypt';
import { OrganizationService } from '../modules/organization/organization.service';
import { AccountsService } from '../modules/accounts/accounts.service';
import { JournalEntriesService } from '../modules/journal-entries/journal-entries.service';
import { Decimal } from '@prisma/client/runtime/library';

async function main() {
  console.log('[seed]: clearing existing demo data...');
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0;`);
  await prisma.notification.deleteMany({});
  await prisma.journalLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.expense.deleteMany({});
  
  // New Sales tables
  await prisma.salesReturnItem.deleteMany({});
  await prisma.salesReturn.deleteMany({});
  await prisma.salesInvoiceItem.deleteMany({});
  await prisma.salesInvoice.deleteMany({});
  await prisma.salesOrderItem.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.couponUsage.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.discount.deleteMany({});

  // New Purchase tables
  await prisma.supplierReturnItem.deleteMany({});
  await prisma.supplierReturn.deleteMany({});
  await prisma.goodsReceivedItem.deleteMany({});
  await prisma.goodsReceived.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});

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
  const modules = ['customers', 'invoices', 'expenses', 'income', 'accounting', 'products', 'suppliers', 'inventory', 'reports', 'settings', 'sales', 'purchases'];
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
      { organizationId: orgId, category: 'Internet', description: 'Direct Hosting AWS', amount: 4800, date: new Date(y, 0, 4) },
      { organizationId: orgId, category: 'Office', description: 'Vercel Enterprise Billing', amount: 1200, date: new Date(y, 1, 10) },
    ],
  });

  await prisma.income.createMany({
    data: [
      { organizationId: orgId, category: 'Services', description: 'Consulting retainer - Apex Global', amount: 15000, date: new Date(y, 0, 10), referenceNo: 'INC-001' },
      { organizationId: orgId, category: 'Sales', description: 'Product license sales', amount: 8500, date: new Date(y, 1, 5), referenceNo: 'INC-002' },
    ],
  });

  console.log('[seed]: seeding FinFlow HQ chart of accounts...');
  await AccountsService.seedDefaultChart(orgId);
  const ffCash = await AccountsService.getByCode(orgId, '1010');
  const ffSales = await AccountsService.getByCode(orgId, '4010');
  const ffOffice = await AccountsService.getByCode(orgId, '5010');
  if (ffCash && ffSales && ffOffice) {
    await JournalEntriesService.create(orgId, {
      date: new Date(y, 0, 15).toISOString().split('T')[0],
      description: 'Opening balance',
      status: 'posted',
      lines: [
        { accountId: ffCash.id, debit: 185000, credit: 0 },
        { accountId: ffSales.id, debit: 0, credit: 100000 },
        { accountId: ffOffice.id, debit: 0, credit: 85000 },
      ],
    });
  }

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
  const accountantPermKeys = [
    'dashboard.view', 'reports.view', 'notifications.view', 'invoices.view', 'invoices.create', 'invoices.update', 'invoices.export',
    'expenses.view', 'expenses.create', 'expenses.export', 'income.view', 'income.create', 'income.export',
    'accounting.view', 'accounting.create', 'accounting.update', 'accounting.export', 'accounting.approve',
    'customers.view', 'suppliers.view', 'products.view',
    'sales.view', 'sales.create', 'sales.update', 'sales.delete', 'sales.export', 'sales.approve',
    'purchases.view', 'purchases.create', 'purchases.update', 'purchases.delete', 'purchases.export', 'purchases.approve'
  ];
  const cashierPermKeys = [
    'dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'customers.view', 'products.view',
    'sales.view', 'sales.create'
  ];
  const salesPermKeys = [
    'dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'customers.view', 'customers.create', 'products.view',
    'sales.view', 'sales.create', 'sales.update'
  ];
  const storePermKeys = [
    'dashboard.view', 'notifications.view', 'products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.create', 'suppliers.view', 'suppliers.create',
    'purchases.view', 'purchases.create', 'purchases.update'
  ];

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
      { organizationId: dfnOrgId, category: 'Internet', description: 'AWS Financial Cloud High-Availability Cluster', amount: 12500, date: new Date(y, 0, 5) },
      { organizationId: dfnOrgId, category: 'Office', description: 'Dubai Silicon Oasis Commercial HQ Rent', amount: 8400, date: new Date(y, 0, 15) },
      { organizationId: dfnOrgId, category: 'Salary', description: 'Sales & Financial Engineering Payroll', amount: 42000, date: new Date(y, 1, 1) },
      { organizationId: dfnOrgId, category: 'Utilities', description: 'Bloomberg Financial Data Feed Subscription', amount: 6200, date: new Date(y, 1, 12) },
    ],
  });

  await prisma.income.createMany({
    data: [
      { organizationId: dfnOrgId, category: 'Sales', description: 'Terminal license sales - Tadawul', amount: 48500, date: new Date(y, 0, 20), referenceNo: 'DFN-INC-001' },
      { organizationId: dfnOrgId, category: 'Services', description: 'Implementation services - ADX', amount: 22000, date: new Date(y, 1, 8), referenceNo: 'DFN-INC-002' },
      { organizationId: dfnOrgId, category: 'Investment', description: 'Treasury investment yield', amount: 3500, date: new Date(y, 1, 28), referenceNo: 'DFN-INC-003' },
    ],
  });

  console.log('[seed]: seeding DirectFN chart of accounts...');
  await AccountsService.seedDefaultChart(dfnOrgId);
  const dfnCash = await AccountsService.getByCode(dfnOrgId, '1010');
  const dfnSales = await AccountsService.getByCode(dfnOrgId, '4010');
  const dfnServices = await AccountsService.getByCode(dfnOrgId, '4020');
  const dfnSalary = await AccountsService.getByCode(dfnOrgId, '5020');
  if (dfnCash && dfnSales && dfnServices && dfnSalary) {
    await JournalEntriesService.create(dfnOrgId, {
      date: new Date(y, 0, 1).toISOString().split('T')[0],
      description: 'Opening balances',
      status: 'posted',
      lines: [
        { accountId: dfnCash.id, debit: 450000, credit: 0 },
        { accountId: dfnSales.id, debit: 0, credit: 300000 },
        { accountId: dfnServices.id, debit: 0, credit: 100000 },
        { accountId: dfnSalary.id, debit: 50000, credit: 0 },
      ],
    });
  }

  // Seed DirectFN Bank Accounts
  console.log('[seed]: seeding DirectFN Bank Accounts...');
  await prisma.bankAccount.createMany({
    data: [
      { organizationId: dfnOrgId, name: 'Emirates NBD Primary Treasury Account', accountNumber: 'ENBD-DFN-9901', bankName: 'Emirates NBD', balance: 340000, currency: 'USD', isActive: true },
      { organizationId: dfnOrgId, name: 'FAB Operations Checking', accountNumber: 'FAB-DFN-4412', bankName: 'First Abu Dhabi Bank', balance: 125000, currency: 'USD', isActive: true },
    ],
  });

  // Seed DirectFN Discounts & Coupons
  console.log('[seed]: seeding DirectFN Discounts & Coupons...');
  const discount1 = await prisma.discount.create({
    data: {
      organizationId: dfnOrgId,
      name: 'Summer Sale 10%',
      type: 'percentage',
      value: new Decimal(10),
      minOrderAmount: new Decimal(100),
      isActive: true,
    }
  });

  const coupon1 = await prisma.coupon.create({
    data: {
      organizationId: dfnOrgId,
      code: 'WELCOME50',
      discountType: 'fixed',
      discountValue: new Decimal(50),
      minOrderAmount: new Decimal(200),
      startDate: new Date(y, 0, 1),
      endDate: new Date(y, 11, 31),
      isActive: true,
      usageLimit: 100,
    }
  });

  // Seed DirectFN Sales Orders
  console.log('[seed]: seeding DirectFN Sales Orders...');
  const so1 = await prisma.salesOrder.create({
    data: {
      organizationId: dfnOrgId,
      orderNo: 'SO-2026-0001',
      customerId: tadawul.id,
      subtotal: new Decimal(1998.00),
      discountAmount: new Decimal(199.80),
      taxAmount: new Decimal(0.00),
      totalAmount: new Decimal(1798.20),
      status: 'Confirmed',
      discountId: discount1.id,
      notes: 'Please expedite delivery.',
      items: {
        create: [
          { productId: p1.id, quantity: 2, unitPrice: new Decimal(999.00), discount: new Decimal(0.00), taxRate: new Decimal(0.00), lineTotal: new Decimal(1998.00) }
        ]
      }
    }
  });

  const so2 = await prisma.salesOrder.create({
    data: {
      organizationId: dfnOrgId,
      orderNo: 'SO-2026-0002',
      customerId: dfm.id,
      subtotal: new Decimal(650.00),
      discountAmount: new Decimal(50.00),
      taxAmount: new Decimal(0.00),
      totalAmount: new Decimal(600.00),
      status: 'Draft',
      couponId: coupon1.id,
      items: {
        create: [
          { productId: p2.id, quantity: 1, unitPrice: new Decimal(650.00), discount: new Decimal(0.00), taxRate: new Decimal(0.00), lineTotal: new Decimal(650.00) }
        ]
      }
    }
  });

  // Seed DirectFN Purchase Orders
  console.log('[seed]: seeding DirectFN Purchase Orders...');
  await prisma.purchaseOrder.create({
    data: {
      organizationId: dfnOrgId,
      orderNo: 'PO-2026-0001',
      supplierId: oracle.id,
      subtotal: new Decimal(900.00),
      taxAmount: new Decimal(0.00),
      totalAmount: new Decimal(900.00),
      status: 'Sent',
      items: {
        create: [
          { productId: p1.id, quantity: 2, unitPrice: new Decimal(450.00), lineTotal: new Decimal(900.00) }
        ]
      }
    }
  });

  await prisma.purchaseOrder.create({
    data: {
      organizationId: dfnOrgId,
      orderNo: 'PO-2026-0002',
      supplierId: cisco.id,
      subtotal: new Decimal(320.00),
      taxAmount: new Decimal(0.00),
      totalAmount: new Decimal(320.00),
      status: 'Draft',
      items: {
        create: [
          { productId: p2.id, quantity: 1, unitPrice: new Decimal(320.00), lineTotal: new Decimal(320.00) }
        ]
      }
    }
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
