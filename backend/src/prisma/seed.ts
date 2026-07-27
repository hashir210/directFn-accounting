import dotenv from 'dotenv';
dotenv.config();

import prisma from '../config/db';
import * as bcrypt from 'bcrypt';
import { OrganizationService } from '../modules/organization/organization.service';
import { AccountsService } from '../modules/accounts/accounts.service';
import { JournalEntriesService } from '../modules/journal-entries/journal-entries.service';
import { Decimal } from '@prisma/client/runtime/library';

async function main() {
  console.log('[seed]: clearing existing demo data...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.purchaseBill.deleteMany({});
  await prisma.supplierPayment.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.emailVerificationToken.deleteMany({});
  await prisma.userScreenBlock.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.planFeature.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');

  // =========================================================================
  // PERMISSIONS
  // =========================================================================
  console.log('[seed]: seeding permissions...');
  const modules = ['customers', 'invoices', 'expenses', 'products', 'suppliers', 'inventory', 'reports', 'settings', 'payments'];
  const actions = ['view', 'create', 'update', 'delete', 'export', 'approve'];
  const permissionKeys: string[] = [
    'dashboard.view', 'notifications.view', 'users.manage', 'roles.manage', 'screens.manage',
    'platform.view', 'platform.orgs.manage', 'platform.users.manage',
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
  const permMap = new Map(permissions.map(p => [p.key, p]));

  // =========================================================================
  // SUBSCRIPTION PLANS WITH FEATURES
  // =========================================================================
  console.log('[seed]: seeding subscription plans...');
  const [freePlan, proPlan, enterprisePlan] = await Promise.all([
    prisma.subscriptionPlan.create({ data: { name: 'Free', description: 'Starter tier — core screens only' } }),
    prisma.subscriptionPlan.create({ data: { name: 'Pro', description: 'Growing business — most screens enabled' } }),
    prisma.subscriptionPlan.create({ data: { name: 'Enterprise', description: 'Full access — custom arrangement' } }),
  ]);

  const allFeatureKeys = ['dashboard', 'invoices', 'expenses', 'payments', 'company', 'customers', 'suppliers', 'products', 'inventory', 'notifications', 'reports', 'active', 'past', 'users', 'roles', 'screens', 'plan', 'integrations', 'inbox', 'platform'];
  for (const plan of [freePlan, proPlan, enterprisePlan]) {
    const featureCount = plan === freePlan ? 8 : plan === proPlan ? 15 : allFeatureKeys.length;
    for (let i = 0; i < featureCount; i++) {
      await prisma.planFeature.create({ data: { planId: plan.id, featureKey: allFeatureKeys[i] } });
    }
  }

  const hashed = await bcrypt.hash('Password123!', 10);
  const now = new Date();
  const y = now.getFullYear();

  // =========================================================================
  // HELPER — generates dates across multiple months for reports
  // =========================================================================
  function monthsAgo(n: number): Date {
    const d = new Date(y, now.getMonth() - n, Math.floor(Math.random() * 25) + 3);
    return d;
  }

  // =========================================================================
  // FINFLOW HQ (Platform Org)
  // =========================================================================
  console.log('[seed]: creating FinFlow HQ (platform)...');
  const ffOrgId = 'org-finflow';
  const ffAdminId = 'usr-admin';

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');

  await prisma.organization.create({
    data: { id: ffOrgId, name: 'FinFlow HQ', ownerId: ffAdminId, isPlatform: true, maxUsers: 999, contactEmail: 'ops@finflow.com', gstVatNumber: 'PLT-99-8888888', currency: 'USD', timeZone: 'UTC-5', fiscalYear: 'jan-dec' },
  });

  const ffAdminRole = await prisma.role.create({ data: { organizationId: ffOrgId, name: 'Admin', isSystemRole: true } });

  await prisma.user.create({ data: { id: ffAdminId, organizationId: ffOrgId, roleId: ffAdminRole.id, email: 'admin@finflow.com', password: hashed, name: 'Platform Admin', emailVerified: true } });

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');

  for (const perm of permissions) {
    await prisma.rolePermission.create({ data: { roleId: ffAdminRole.id, permissionId: perm.id } });
  }

  // FinFlow Bank Account (for subscription revenue tracking)
  await prisma.bankAccount.create({
    data: { organizationId: ffOrgId, name: 'Platform Revenue Account', accountNumber: 'FF-REV-001', bankName: 'FinBank', balance: 12500, currency: 'USD', isActive: true },
  });

  // FinFlow Notifications (platform-related only)
  await prisma.notification.createMany({
    data: [
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Platform Ready', message: 'FinFlow HQ platform is set up and ready to manage tenants.', type: 'info' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Tenant Provisioned', message: 'DirectFN Trading has been provisioned successfully.', type: 'success' },
    ],
  });

  // FinFlow Audit Logs (platform management actions only)
  await prisma.auditLog.createMany({
    data: [
      { organizationId: ffOrgId, userId: ffAdminId, action: 'LOGIN', entity: 'USER', entityId: ffAdminId, details: JSON.stringify({ ip: '192.168.1.1', browser: 'Chrome 120' }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'CREATE', entity: 'ORGANIZATION', details: JSON.stringify({ name: 'DirectFN Trading' }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'CREATE', entity: 'SUBSCRIPTION_PLAN', details: JSON.stringify({ plan: 'Pro', org: 'DirectFN Trading' }), ipAddress: '192.168.1.1' },
    ],
  });

  // =========================================================================
  // DIRECTFN TRADING (Tenant Org)
  // =========================================================================
  console.log('[seed]: creating DirectFN Trading (tenant)...');
  const tenantPasswordHash = await bcrypt.hash('Password123!', 10);
  const { org: dfnOrg, user: dfnOwner } = await OrganizationService.createOrganizationWithUser(
    'DirectFN Trading', { email: 'owner@directfn.com', passwordHash: tenantPasswordHash, name: 'DirectFN Admin Owner' }
  );
  const dfnOrgId = dfnOrg.id;
  await prisma.user.update({ where: { id: dfnOrg.ownerId }, data: { emailVerified: true } });

  const dfnAdminRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Admin' } })!;
  const dfnAccountantRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Accountant' } });
  const dfnCashierRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Cashier' } });
  const dfnSalesRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Sales Person' } });
  const dfnStoreRole = await prisma.role.findFirst({ where: { organizationId: dfnOrgId, name: 'Store Manager' } });

  if (dfnAdminRole) {
    for (const perm of permissions) {
      await prisma.rolePermission.create({ data: { roleId: dfnAdminRole.id, permissionId: perm.id } });
    }
  }

  const accountantPermKeys = ['dashboard.view', 'reports.view', 'notifications.view', 'invoices.view', 'invoices.create', 'invoices.update', 'invoices.export', 'expenses.view', 'expenses.create', 'expenses.export', 'customers.view', 'suppliers.view', 'products.view', 'payments.view', 'payments.create', 'payments.export'];
  const cashierPermKeys = ['dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'customers.view', 'products.view', 'payments.view', 'payments.create'];
  const salesPermKeys = ['dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'customers.view', 'customers.create', 'products.view'];
  const storePermKeys = ['dashboard.view', 'notifications.view', 'products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.create', 'suppliers.view', 'suppliers.create'];

  if (dfnAccountantRole) for (const k of accountantPermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnAccountantRole.id, permissionId: p.id } }); }
  if (dfnCashierRole) for (const k of cashierPermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnCashierRole.id, permissionId: p.id } }); }
  if (dfnSalesRole) for (const k of salesPermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnSalesRole.id, permissionId: p.id } }); }
  if (dfnStoreRole) for (const k of storePermKeys) { const p = permMap.get(k); if (p) await prisma.rolePermission.create({ data: { roleId: dfnStoreRole.id, permissionId: p.id } }); }

  await Promise.all([
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnAccountantRole?.id || dfnAdminRole!.id, email: 'accountant@directfn.com', password: tenantPasswordHash, name: 'DirectFN Chief Accountant', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnCashierRole?.id || dfnAdminRole!.id, email: 'cashier@directfn.com', password: tenantPasswordHash, name: 'DirectFN POS Cashier', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnSalesRole?.id || dfnAdminRole!.id, email: 'sales@directfn.com', password: tenantPasswordHash, name: 'DirectFN Senior Sales Exec', emailVerified: true } }),
    prisma.user.create({ data: { organizationId: dfnOrgId, roleId: dfnStoreRole?.id || dfnAdminRole!.id, email: 'store@directfn.com', password: tenantPasswordHash, name: 'DirectFN Warehouse Manager', emailVerified: true } }),
  ]);

  await prisma.organization.update({
    where: { id: dfnOrgId },
    data: { planId: proPlan.id, contactEmail: 'billing@directfn.com', gstVatNumber: 'GST-DFN-445566', currency: 'AED', timeZone: 'UTC+4', fiscalYear: 'jan-dec', maxUsers: 25 },
  });

  // DirectFN Warehouses
  const [dlc, rdh] = await Promise.all([
    prisma.warehouse.create({ data: { organizationId: dfnOrgId, name: 'Dubai Logistics Center', code: 'DLC-01' } }),
    prisma.warehouse.create({ data: { organizationId: dfnOrgId, name: 'Riyadh Distribution Hub', code: 'RDH-02' } }),
  ]);

  // DirectFN Products
  const [dp1, dp2, dp3, dp4, dp5, dp6] = await Promise.all([
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'DirectFN Pro Terminal License V5', sku: 'DFN-TRM-V5', category: 'Software', stockQuantity: 50, lowStockThreshold: 10, purchasePrice: 450.0, sellingPrice: 999.0, taxRate: 13, imageUrl: 'https://images.unsplash.com/photo-1556742049-0a6792357321' } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'DirectFN Smart POS Touch Terminal', sku: 'DFN-POS-T1', category: 'Hardware', stockQuantity: 6, lowStockThreshold: 15, purchasePrice: 320.0, sellingPrice: 650.0, taxRate: 13, imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df' } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'Thermal Receipt Paper Roll (Box of 50)', sku: 'DFN-PAP-80', category: 'Consumables', stockQuantity: 120, lowStockThreshold: 30, purchasePrice: 18.0, sellingPrice: 45.0, taxRate: 5 } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'High-Speed Financial Gateway Router', sku: 'DFN-GW-RTR', category: 'Hardware', stockQuantity: 2, lowStockThreshold: 8, purchasePrice: 850.0, sellingPrice: 1750.0, taxRate: 13 } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'DirectFN Mobile Trading Dongle', sku: 'DFN-NFC-DGL', category: 'Hardware', stockQuantity: 0, lowStockThreshold: 20, purchasePrice: 25.0, sellingPrice: 69.0, taxRate: 5 } }),
    prisma.product.create({ data: { organizationId: dfnOrgId, name: 'Biometric Authentication Module', sku: 'DFN-BIO-M1', category: 'Hardware', stockQuantity: 14, lowStockThreshold: 5, purchasePrice: 120.0, sellingPrice: 299.0, taxRate: 13 } }),
  ]);

  // DirectFN Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      { organizationId: dfnOrgId, type: 'Stock In', sku: dp1.sku, itemName: dp1.name, quantity: 50, warehouse: dlc.name, warehouseId: dlc.id, status: 'Completed', createdAt: monthsAgo(6) },
      { organizationId: dfnOrgId, type: 'Stock In', sku: dp2.sku, itemName: dp2.name, quantity: 15, warehouse: dlc.name, warehouseId: dlc.id, status: 'Completed', createdAt: monthsAgo(4) },
      { organizationId: dfnOrgId, type: 'Transfer', sku: dp2.sku, itemName: dp2.name, quantity: 5, warehouse: rdh.name, warehouseId: rdh.id, status: 'Transferred', createdAt: monthsAgo(2) },
      { organizationId: dfnOrgId, type: 'Damaged', sku: dp4.sku, itemName: dp4.name, quantity: 1, warehouse: dlc.name, warehouseId: dlc.id, status: 'Written Off', createdAt: monthsAgo(1) },
      { organizationId: dfnOrgId, type: 'Stock In', sku: dp5.sku, itemName: dp5.name, quantity: 25, warehouse: dlc.name, warehouseId: dlc.id, status: 'Completed', createdAt: monthsAgo(3) },
      { organizationId: dfnOrgId, type: 'Stock In', sku: dp6.sku, itemName: dp6.name, quantity: 20, warehouse: dlc.name, warehouseId: dlc.id, status: 'Completed', createdAt: monthsAgo(2) },
      { organizationId: dfnOrgId, type: 'Stock Out', sku: dp6.sku, itemName: dp6.name, quantity: 6, warehouse: dlc.name, warehouseId: dlc.id, status: 'Completed', createdAt: monthsAgo(1) },
    ],
  });

  // DirectFN Customers
  const [dfm, tadawul, adx, qse, ksf] = await Promise.all([
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Dubai Financial Market (DFM)', email: 'settlement@dfm.ae', phone: '+971 4 305 5555', creditLimit: 100000, status: 'Active' } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Saudi Tadawul Group', email: 'custody@tadawul.sa', phone: '+966 11 218 9999', creditLimit: 250000, status: 'Active' } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Abu Dhabi Securities Exchange', email: 'clearing@adx.ae', phone: '+971 2 627 7777', creditLimit: 150000, status: 'Active' } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Qatar Stock Exchange', email: 'finance@qse.qa', phone: '+974 4445 5555', creditLimit: 120000, status: 'Active' } }),
    prisma.customer.create({ data: { organizationId: dfnOrgId, name: 'Kuwait Financial Services Co.', email: 'accounts@kfs.kw', phone: '+965 2224 8888', creditLimit: 80000, status: 'Active' } }),
  ]);

  // DirectFN Invoices with Line Items (months of data)
  const dfnCustomers = [dfm, tadawul, adx, qse, ksf, dfm, tadawul, adx];
  for (let i = 0; i < 20; i++) {
    const customer = dfnCustomers[i % dfnCustomers.length];
    const amount = Math.floor(Math.random() * 55000) + 3000;
    const taxTotal = Math.round(amount * 0.13 * 100) / 100;
    const subTotal = amount - taxTotal;
    const status = ['paid', 'pending', 'overdue', 'paid', 'paid', 'pending', 'paid', 'paid'][i % 8];
    const inv = await prisma.invoice.create({
      data: {
        organizationId: dfnOrgId, invoiceNo: `DFN-INV-${y}-${String(i + 1).padStart(3, '0')}`,
        customerId: customer.id, amount, subTotal, taxTotal, discountTotal: 0,
        status, issuedAt: monthsAgo(i + 1), dueAt: monthsAgo(i),
        paidAt: status === 'paid' ? monthsAgo(i + 0.5) : null,
      },
    });
    const items = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < items; j++) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: inv.id, description: `Item ${j + 1} for ${customer.name}`,
          quantity: j + 1, unitPrice: Math.round(amount / items * 100) / 100,
          taxRate: 13, taxAmount: Math.round(amount * 0.13 / items * 100) / 100,
          total: Math.round(amount / items * 100) / 100,
        },
      });
    }
  }

  // DirectFN Suppliers + Bills + Payments
  const [oracle, cisco, dell, awsEmea, msft] = await Promise.all([
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Oracle Middle East FZ', category: 'Software & DB', contactEmail: 'license@oracle.com', phone: '+971 4 390 0000', paymentTerms: 'Net 30', dueAmount: 18500 } }),
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Cisco Systems Gulf', category: 'Networking', contactEmail: 'orders@cisco.com', phone: '+971 4 390 1000', paymentTerms: 'Net 45', dueAmount: 12400 } }),
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Dell Technologies FZ-LLC', category: 'Hardware', contactEmail: 'hardware@dell.com', phone: '+971 4 391 2000', paymentTerms: 'Net 30', dueAmount: 0 } }),
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Amazon Web Services EMEA', category: 'Cloud Infrastructure', contactEmail: 'aws-billing@amazon.com', phone: '+1 206 266 1000', paymentTerms: 'Net 15', dueAmount: 12500 } }),
    prisma.supplier.create({ data: { organizationId: dfnOrgId, name: 'Microsoft Gulf', category: 'Software & DB', contactEmail: 'licensing@microsoft.com', phone: '+971 4 392 3000', paymentTerms: 'Net 30', dueAmount: 22000 } }),
  ]);

  await prisma.purchaseBill.createMany({
    data: [
      { organizationId: dfnOrgId, supplierId: oracle.id, billNo: 'ORCL-BILL-991', amount: 18500, status: 'Pending', dueDate: monthsAgo(0) },
      { organizationId: dfnOrgId, supplierId: cisco.id, billNo: 'CSCO-BILL-442', amount: 12400, status: 'Pending', dueDate: monthsAgo(0) },
      { organizationId: dfnOrgId, supplierId: dell.id, billNo: 'DELL-BILL-102', amount: 28000, paidAmount: 28000, status: 'Paid', dueDate: monthsAgo(2) },
      { organizationId: dfnOrgId, supplierId: msft.id, billNo: 'MSFT-BILL-301', amount: 22000, status: 'Pending', dueDate: monthsAgo(1) },
      { organizationId: dfnOrgId, supplierId: awsEmea.id, billNo: 'AWS-BILL-501', amount: 12500, status: 'Pending', dueDate: monthsAgo(0) },
    ],
  });

  await prisma.supplierPayment.createMany({
    data: [
      { supplierId: dell.id, amount: 28000, note: 'Full payment for DELL-BILL-102' },
    ],
  });

  // DirectFN Expenses (30 records across categories)
  const dfnExpenseCategories = ['Hosting', 'Salaries', 'Rent', 'Software', 'Marketing', 'Travel', 'Utilities', 'Office Supplies', 'Legal', 'Insurance'];
  for (let i = 0; i < 40; i++) {
    await prisma.expense.create({
      data: {
        organizationId: dfnOrgId, category: dfnExpenseCategories[i % dfnExpenseCategories.length],
        description: `${dfnExpenseCategories[i % dfnExpenseCategories.length]} — ${['Monthly subscription', 'Annual renewal', 'Q1 payment', 'Staff reimbursement', 'Vendor invoice'][i % 5]}`,
        amount: Math.floor(Math.random() * 12000) + 800, date: monthsAgo(i),
      },
    });
  }

  // DirectFN Bank Accounts
  await prisma.bankAccount.createMany({
    data: [
      { organizationId: dfnOrgId, name: 'Emirates NBD Treasury', accountNumber: 'ENBD-DFN-9901', bankName: 'Emirates NBD', balance: 340000, currency: 'AED', isActive: true },
      { organizationId: dfnOrgId, name: 'FAB Operations Checking', accountNumber: 'FAB-DFN-4412', bankName: 'First Abu Dhabi Bank', balance: 125000, currency: 'AED', isActive: true },
      { organizationId: dfnOrgId, name: 'ADCB Payroll Account', accountNumber: 'ADCB-DFN-7710', bankName: 'Abu Dhabi Commercial Bank', balance: 82000, currency: 'AED', isActive: true },
    ],
  });

  // DirectFN Payments (link paid invoices)
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
  const dfnPaidInvoices = await prisma.invoice.findMany({ where: { organizationId: dfnOrgId, status: 'paid' } });
  for (const inv of dfnPaidInvoices) {
    await prisma.payment.create({
      data: { organizationId: dfnOrgId, amount: inv.amount, method: ['Bank', 'Card', 'Online', 'Cash'][Math.floor(Math.random() * 4)], type: 'Inbound', status: 'Completed', referenceType: 'Invoice', referenceId: inv.id },
    });
  }
  // Add outbound payments
  const dfnBills = await prisma.purchaseBill.findMany({ where: { organizationId: dfnOrgId, status: 'Paid' } });
  for (const bill of dfnBills) {
    await prisma.payment.create({
      data: { organizationId: dfnOrgId, amount: bill.amount, method: 'Bank', type: 'Outbound', status: 'Completed', referenceType: 'PurchaseBill', referenceId: bill.id },
    });
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');

  // DirectFN Notifications
  await prisma.notification.createMany({
    data: [
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Welcome to DirectFN Trading', message: 'Your tenant workspace is ready. Explore the dashboard.', type: 'info' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Invoice Overdue Alert', message: 'ADX invoice DFN-INV-2026-003 ($14,800) is overdue.', type: 'warning', referenceType: 'Invoice' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Payment Received', message: 'Saudi Tadawul Group completed payment of $48,500.', type: 'success', referenceType: 'Invoice' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Low Stock Alert', message: 'DirectFN Mobile Trading Dongle is out of stock.', type: 'warning', referenceType: 'Product' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Subscription Renewal', message: 'Your Pro plan renews in 30 days.', type: 'info' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Security Alert: New Login', message: 'New login detected from Dubai, UAE.', type: 'warning' },
    ],
  });

  // DirectFN Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'LOGIN', entity: 'USER', entityId: dfnOrg.ownerId, details: JSON.stringify({ ip: '10.0.0.1', browser: 'Chrome 120' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'INVOICE', details: JSON.stringify({ invoiceNo: 'DFN-INV-2026-001', amount: 48500 }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'CUSTOMER', entityId: dfm.id, details: JSON.stringify({ name: 'Dubai Financial Market' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'UPDATE', entity: 'SUPPLIER', entityId: oracle.id, details: JSON.stringify({ name: 'Oracle Middle East', paymentTerms: 'Net 30' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'PAYMENT', details: JSON.stringify({ amount: 28000, type: 'Outbound' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'LOGIN', entity: 'USER', entityId: dfnOrg.ownerId, details: JSON.stringify({ ip: '10.0.0.2', browser: 'Safari 18' }), ipAddress: '10.0.0.2' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'UPDATE', entity: 'INVENTORY', entityId: dp5.id, details: JSON.stringify({ sku: dp5.sku, stockChange: -1, reason: 'Damaged' }), ipAddress: '10.0.0.1' },
    ],
  });

  // =========================================================================
  // CREATE SESSIONS
  // =========================================================================
  console.log('[seed]: seeding sessions...');
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    await prisma.refreshToken.create({
      data: {
        token: `mock-rt-${user.id}-${Date.now()}`,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('[seed]: COMPLETE. Users seeded:');
  console.log('  FinFlow HQ: admin@finflow.com / Password123!');
  console.log('  DirectFN Trading: owner@directfn.com / Password123!');
  console.log('  All other users password: Password123!');
}

main()
  .catch((e) => {
    console.error('[seed]: failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
