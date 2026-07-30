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
  await prisma.supplierReturnItem.deleteMany({});
  await prisma.supplierReturn.deleteMany({});
  await prisma.goodsReceivedItem.deleteMany({});
  await prisma.goodsReceived.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.salesReturnItem.deleteMany({});
  await prisma.salesReturn.deleteMany({});
  await prisma.salesInvoiceItem.deleteMany({});
  await prisma.salesInvoice.deleteMany({});
  await prisma.salesOrderItem.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.couponUsage.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.discount.deleteMany({});
  // fiscalArchive removed
  await prisma.journalLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.purchaseBill.deleteMany({});
  await prisma.supplierPayment.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tax.deleteMany({});
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
  const modules = ['customers', 'invoices', 'expenses', 'products', 'suppliers', 'inventory', 'reports', 'settings', 'payments', 'sales', 'purchases', 'accounting', 'income'];
  const actions = ['view', 'create', 'update', 'delete', 'export', 'approve', 'edit'];
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

  const allFeatureKeys = ['dashboard', 'invoices', 'expenses', 'payments', 'sales', 'purchases', 'accounting', 'income', 'company', 'customers', 'suppliers', 'products', 'inventory', 'notifications', 'reports', 'users', 'roles', 'screens', 'plan', 'integrations', 'inbox', 'platform'];
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

  // Shared category constants for both FinFlow and DirectFN
  const expenseCategories = ['Office', 'Salary', 'Utilities', 'Fuel', 'Internet', 'Miscellaneous'];
  const incomeCategories = ['Sales', 'Services', 'Investment', 'Other Income'];
  const expenseDescriptions = [
    'Monthly office rent', 'Office supplies & stationery', 'Cleaning & maintenance',
    'Staff salaries', 'Payroll processing fees', 'Employee bonuses',
    'DEWA electricity bill', 'Chiller & AC maintenance', 'Water & sewage charges',
    'Petrol for fleet vehicles', 'Vehicle maintenance', 'Fuel cards top-up',
    'Du Telecom monthly bill', 'Ethernet leased line', 'VPN & cloud connectivity',
    'Consulting fees - IT audit', 'Bank charges & commissions', 'Legal retainer fee',
    'Employee training & workshops', 'Team building event', 'Printing & documentation',
    'Software license renewals', 'Annual insurance premium', 'Security system maintenance',
  ];

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

  const hashedEasy = await bcrypt.hash('password', 10);
  await prisma.user.create({ data: { organizationId: ffOrgId, roleId: ffAdminRole.id, email: 'admin2@finflow.com', password: hashedEasy, name: 'Platform Admin 2', emailVerified: true } });

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');

  for (const perm of permissions) {
    await prisma.rolePermission.create({ data: { roleId: ffAdminRole.id, permissionId: perm.id } });
  }

  // FinFlow Bank Accounts (more for platform dashboard)
  await prisma.bankAccount.createMany({
    data: [
      { organizationId: ffOrgId, name: 'Platform Revenue Account', accountNumber: 'FF-REV-001', bankName: 'FinBank', balance: 12500, currency: 'USD', isActive: true },
      { organizationId: ffOrgId, name: 'Operations Escrow', accountNumber: 'FF-ESC-002', bankName: 'FinBank', balance: 85000, currency: 'USD', isActive: true },
      { organizationId: ffOrgId, name: 'Subscription Collection', accountNumber: 'FF-SUB-003', bankName: 'FinBank', balance: 42000, currency: 'USD', isActive: true },
    ],
  });

  // FinFlow Customers (demo B2B buyers of platform subscriptions)
  const [ffCust1, ffCust2, ffCust3, ffCust4] = await Promise.all([
    prisma.customer.create({ data: { organizationId: ffOrgId, name: 'DirectFN Trading', email: 'billing@directfn.com', phone: '+971 4 123 4567', creditLimit: 100000, status: 'Active' } }),
    prisma.customer.create({ data: { organizationId: ffOrgId, name: 'Abu Dhabi Securities Exchange', email: 'finance@adx.ae', phone: '+971 2 627 7777', creditLimit: 200000, status: 'Active' } }),
    prisma.customer.create({ data: { organizationId: ffOrgId, name: 'Qatar Financial Services', email: 'accounts@qfs.qa', phone: '+974 4445 6789', creditLimit: 150000, status: 'Active' } }),
    prisma.customer.create({ data: { organizationId: ffOrgId, name: 'Kuwait Investment Authority', email: 'treasury@kia.kw', phone: '+965 2224 1111', creditLimit: 300000, status: 'Active' } }),
  ]);

  // FinFlow Products (demo SaaS products)
  const [ffProd1, ffProd2, ffProd3] = await Promise.all([
    prisma.product.create({ data: { organizationId: ffOrgId, name: 'FinFlow Pro License', sku: 'FF-PRO-LIC', category: 'SaaS', stockQuantity: 999, lowStockThreshold: 10, purchasePrice: 0, sellingPrice: 299.0, taxRate: 0 } }),
    prisma.product.create({ data: { organizationId: ffOrgId, name: 'FinFlow Enterprise License', sku: 'FF-ENT-LIC', category: 'SaaS', stockQuantity: 999, lowStockThreshold: 5, purchasePrice: 0, sellingPrice: 999.0, taxRate: 0 } }),
    prisma.product.create({ data: { organizationId: ffOrgId, name: 'FinFlow API Credits (1K)', sku: 'FF-API-1K', category: 'SaaS', stockQuantity: 9999, lowStockThreshold: 100, purchasePrice: 0, sellingPrice: 49.0, taxRate: 0 } }),
  ]);

  // FinFlow Expenses
  for (let i = 0; i < 12; i++) {
    await prisma.expense.create({
      data: {
        organizationId: ffOrgId, category: expenseCategories[i % expenseCategories.length],
        description: ['Cloud hosting - AWS', 'Office rent', 'Staff salaries', 'Marketing campaigns', 'Legal & compliance', 'Software tools'][i % 6],
        amount: Math.floor(Math.random() * 20000) + 2000, date: monthsAgo(i),
      },
    });
  }

  // FinFlow HQ Taxes
  await prisma.tax.createMany({
    data: [
      { organizationId: ffOrgId, name: 'VAT 13%', rate: 13, isActive: true },
      { organizationId: ffOrgId, name: 'GST 5%', rate: 5, isActive: true },
      { organizationId: ffOrgId, name: 'Zero Rated', rate: 0, isActive: true },
      { organizationId: ffOrgId, name: 'Exempt', rate: 0, isActive: true },
      { organizationId: ffOrgId, name: 'Standard VAT 15%', rate: 15, isActive: false },
    ],
  });

  // FinFlow HQ Categories
  const ffCats = [
    { name: 'Software', type: 'PRODUCT' }, { name: 'Services', type: 'PRODUCT' },
    { name: 'Office', type: 'EXPENSE' }, { name: 'Salary', type: 'EXPENSE' },
    { name: 'Sales', type: 'INCOME' }, { name: 'Subscription', type: 'INCOME' },
    { name: 'Software Vendor', type: 'SUPPLIER' },
  ];
  for (const cat of ffCats) {
    await prisma.category.create({ data: { organizationId: ffOrgId, name: cat.name, type: cat.type } });
  }

  // FinFlow Chart of Accounts
  await AccountsService.seedDefaultChart(ffOrgId);

  // FinFlow Income (platform subscription revenue)
  for (let i = 0; i < 12; i++) {
    await prisma.income.create({
      data: {
        organizationId: ffOrgId, category: incomeCategories[i % incomeCategories.length],
        description: ['Monthly subscription - Pro Plan', 'Enterprise onboarding fee', 'API usage revenue', 'Consulting services'][i % 4],
        amount: Math.floor(Math.random() * 30000) + 5000, date: monthsAgo(i),
        referenceNo: `FF-INC-${y}-${String(i + 1).padStart(3, '0')}`,
      },
    });
  }

  // FinFlow Journal Entries
  const ffAccounts = await prisma.account.findMany({ where: { organizationId: ffOrgId } });
  const ffCash = ffAccounts.find(a => a.code === '1010');
  const ffRevenue = ffAccounts.find(a => a.code === '4010');
  const ffSalaryExp = ffAccounts.find(a => a.code === '5020');
  for (let i = 0; i < 6; i++) {
    const je = await prisma.journalEntry.create({
      data: {
        organizationId: ffOrgId, entryNo: `FF-JE-${y}-${String(i + 1).padStart(3, '0')}`,
        date: monthsAgo(i), description: `Platform operating entry ${i + 1}`, status: 'Posted',
      },
    });
    const amt = Math.floor(Math.random() * 15000) + 5000;
    if (i % 2 === 0 && ffCash && ffRevenue) {
      await prisma.journalLine.createMany({ data: [
        { journalEntryId: je.id, accountId: ffCash.id, debit: amt, memo: 'Subscription revenue' },
        { journalEntryId: je.id, accountId: ffRevenue.id, credit: amt, memo: 'Revenue recognized' },
      ]});
    } else if (ffCash && ffSalaryExp) {
      await prisma.journalLine.createMany({ data: [
        { journalEntryId: je.id, accountId: ffSalaryExp.id, debit: amt, memo: 'Operating expense' },
        { journalEntryId: je.id, accountId: ffCash.id, credit: amt, memo: 'Cash outflow' },
      ]});
    }
  }

  // FinFlow Sales Orders (demo licenses)
  const ffCustList = [ffCust1, ffCust2, ffCust3, ffCust4];
  for (let i = 0; i < 5; i++) {
    const cust = ffCustList[i % ffCustList.length];
      const prod = [ffProd1, ffProd2, ffProd3][i % 3];
      const qty = Math.floor(Math.random() * 5) + 1;
      const lineTotal = qty * Number(prod.sellingPrice);
      const taxAmt = Math.round(lineTotal * 0.13 * 100) / 100;

      const so = await prisma.salesOrder.create({
        data: {
          organizationId: ffOrgId, orderNo: `FF-SO-${y}-${String(i + 1).padStart(3, '0')}`,
          customerId: cust.id, subtotal: lineTotal, discountAmount: 0, taxAmount: taxAmt,
          totalAmount: lineTotal + taxAmt, status: ['Confirmed', 'Invoiced', 'Draft', 'Invoiced', 'Confirmed'][i],
        },
      });
      await prisma.salesOrderItem.create({
        data: { salesOrderId: so.id, productId: prod.id, quantity: qty, unitPrice: Number(prod.sellingPrice), discount: 0, taxRate: 13, lineTotal },
      });
  }

  // FinFlow Notifications (platform-related only)
  await prisma.notification.createMany({
    data: [
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Platform Ready', message: 'FinFlow HQ platform is set up and ready to manage tenants.', type: 'info' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Tenant Provisioned', message: 'DirectFN Trading has been provisioned successfully.', type: 'success' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'New Registration', message: 'New organization registered: Qatar Financial Services.', type: 'info' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Subscription Renewed', message: 'DirectFN Trading renewed Pro plan for another year.', type: 'success' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'System Update', message: 'Platform v2.4.1 deployed with new reporting engine.', type: 'info' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Invoice Overdue', message: 'Tenant "Kuwait Financial Services" has overdue invoices.', type: 'warning' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Storage Alert', message: 'Platform file storage at 78% capacity.', type: 'warning' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'New User Invited', message: '5 new team members were added across all tenants.', type: 'info' },
      { organizationId: ffOrgId, userId: ffAdminId, title: 'Payment Collected', message: 'Subscription fee collected from ADX tenant ($1,499).', type: 'success' },
    ],
  });

  // FinFlow Audit Logs (platform management actions only)
  await prisma.auditLog.createMany({
    data: [
      { organizationId: ffOrgId, userId: ffAdminId, action: 'LOGIN', entity: 'USER', entityId: ffAdminId, details: JSON.stringify({ ip: '192.168.1.1', browser: 'Chrome 120' }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'CREATE', entity: 'ORGANIZATION', details: JSON.stringify({ name: 'DirectFN Trading' }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'CREATE', entity: 'SUBSCRIPTION_PLAN', details: JSON.stringify({ plan: 'Pro', org: 'DirectFN Trading' }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'UPDATE', entity: 'SUBSCRIPTION_PLAN', details: JSON.stringify({ plan: 'Enterprise', org: 'Abu Dhabi Securities' }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'CREATE', entity: 'INVOICE', details: JSON.stringify({ tenant: 'Qatar Stock Exchange', amount: 1499 }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'LOGIN', entity: 'USER', entityId: ffAdminId, details: JSON.stringify({ ip: '10.0.0.1', browser: 'Firefox 130' }), ipAddress: '10.0.0.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'DELETE', entity: 'USER', details: JSON.stringify({ email: 'inactive@qse.qa', reason: 'Account closed' }), ipAddress: '192.168.1.1' },
      { organizationId: ffOrgId, userId: ffAdminId, action: 'CREATE', entity: 'COUPON', details: JSON.stringify({ code: 'WELCOME10', discount: '10%' }), ipAddress: '192.168.1.1' },
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

  const accountantPermKeys = ['dashboard.view', 'reports.view', 'notifications.view', 'invoices.view', 'invoices.create', 'invoices.update', 'invoices.edit', 'invoices.export', 'expenses.view', 'expenses.create', 'expenses.export', 'accounting.view', 'income.view', 'customers.view', 'suppliers.view', 'products.view', 'payments.view', 'payments.create', 'payments.export'];
  const cashierPermKeys = ['dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'invoices.edit', 'sales.view', 'customers.view', 'products.view', 'payments.view', 'payments.create'];
  const salesPermKeys = ['dashboard.view', 'notifications.view', 'invoices.view', 'invoices.create', 'invoices.edit', 'sales.view', 'customers.view', 'customers.create', 'customers.edit', 'products.view'];
  const storePermKeys = ['dashboard.view', 'notifications.view', 'purchases.view', 'purchases.edit', 'products.view', 'products.create', 'products.update', 'products.edit', 'inventory.view', 'inventory.create', 'inventory.edit', 'suppliers.view', 'suppliers.create', 'suppliers.edit'];

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

  // DirectFN Taxes
  await prisma.tax.createMany({
    data: [
      { organizationId: dfnOrgId, name: 'VAT 13%', rate: 13, isActive: true },
      { organizationId: dfnOrgId, name: 'GST 5%', rate: 5, isActive: true },
      { organizationId: dfnOrgId, name: 'Zero Rated', rate: 0, isActive: true },
      { organizationId: dfnOrgId, name: 'Exempt', rate: 0, isActive: true },
      { organizationId: dfnOrgId, name: 'Standard VAT 15%', rate: 15, isActive: false },
    ],
  });

  // DirectFN Categories
  const dfnCategories = [
    { name: 'Software', type: 'PRODUCT' }, { name: 'Hardware', type: 'PRODUCT' }, { name: 'Consumables', type: 'PRODUCT' },
    { name: 'Services', type: 'PRODUCT' }, { name: 'Subscriptions', type: 'PRODUCT' },
    { name: 'Office', type: 'EXPENSE' }, { name: 'Salary', type: 'EXPENSE' }, { name: 'Utilities', type: 'EXPENSE' },
    { name: 'Fuel', type: 'EXPENSE' }, { name: 'Internet', type: 'EXPENSE' }, { name: 'Miscellaneous', type: 'EXPENSE' },
    { name: 'Sales', type: 'INCOME' }, { name: 'Services', type: 'INCOME' }, { name: 'Investment', type: 'INCOME' },
    { name: 'Other Income', type: 'INCOME' },
    { name: 'Software & DB', type: 'SUPPLIER' }, { name: 'Networking', type: 'SUPPLIER' }, { name: 'Hardware', type: 'SUPPLIER' },
    { name: 'Cloud Infrastructure', type: 'SUPPLIER' }, { name: 'IT Services', type: 'SUPPLIER' },
  ];
  for (const cat of dfnCategories) {
    await prisma.category.create({ data: { organizationId: dfnOrgId, name: cat.name, type: cat.type } });
  }

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
    const prodPool = [dp1, dp2, dp3, dp4, dp5, dp6];
    for (let j = 0; j < items; j++) {
      const prod = prodPool[(i + j) % prodPool.length];
      await prisma.invoiceItem.create({
        data: {
          invoiceId: inv.id, productId: prod.id,
          description: prod.name,
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

  // DirectFN Expenses (using proper expense categories: Office, Salary, Utilities, Fuel, Internet, Miscellaneous)
  const dfnExpenseDescriptions = [
    'Monthly office rent - Downtown Dubai', 'Office supplies & stationery', 'Cleaning & maintenance',
    'Staff salaries - February', 'Payroll processing fees', 'Employee bonuses',
    'DEWA electricity bill', 'Chiller & AC maintenance', 'Water & sewage charges',
    'Petrol for fleet vehicles', 'Vehicle maintenance', 'Fuel cards top-up',
    'Du Telecom monthly bill', 'Ethernet leased line', 'VPN & cloud connectivity',
    'Consulting fees - IT audit', 'Bank charges & commissions', 'Legal retainer fee',
    'Employee training & workshops', 'Team building event', 'Printing & documentation',
    'Software license renewals', 'Annual insurance premium', 'Security system maintenance',
  ];
  for (let i = 0; i < 48; i++) {
    await prisma.expense.create({
      data: {
        organizationId: dfnOrgId,
        category: expenseCategories[i % expenseCategories.length],
        description: dfnExpenseDescriptions[i % dfnExpenseDescriptions.length],
        amount: Math.floor(Math.random() * 15000) + 500,
        date: monthsAgo(i),
      },
    });
  }

  // DirectFN Chart of Accounts (seed defaults)
  await AccountsService.seedDefaultChart(dfnOrgId);

  // DirectFN Income records (proper categories: Sales, Services, Investment, Other Income)
  const dfnIncomeDescriptions = [
    'Terminal license sale - Q1 batch', 'Software subscription revenue', 'Hardware sale - POS terminals',
    'Consulting & implementation fees', 'Annual maintenance contract', 'Training & onboarding fees',
    'Fixed deposit interest', 'Treasury bill returns', 'Mutual fund dividends',
    'GST rebate received', 'Insurance claim settlement', 'Foreign exchange gain',
    'API integration fee - Tadawul', 'Custom development project', 'Data feed subscription',
  ];
  for (let i = 0; i < 30; i++) {
    await prisma.income.create({
      data: {
        organizationId: dfnOrgId,
        category: incomeCategories[i % incomeCategories.length],
        description: dfnIncomeDescriptions[i % dfnIncomeDescriptions.length],
        amount: Math.floor(Math.random() * 25000) + 2000,
        date: monthsAgo(i),
        referenceNo: `INC-${y}-${String(i + 1).padStart(3, '0')}`,
      },
    });
  }

  // DirectFN Journal Entries (double-entry accounting)
  const dfnAccounts = await prisma.account.findMany({ where: { organizationId: dfnOrgId } });
  const cashAccount = dfnAccounts.find(a => a.code === '1010');
  const revenueAccount = dfnAccounts.find(a => a.code === '4010');
  const expenseAccts = {
    Office: dfnAccounts.find(a => a.code === '5010'),
    Salary: dfnAccounts.find(a => a.code === '5020'),
    Utilities: dfnAccounts.find(a => a.code === '5030'),
    Fuel: dfnAccounts.find(a => a.code === '5040'),
    Internet: dfnAccounts.find(a => a.code === '5050'),
    Miscellaneous: dfnAccounts.find(a => a.code === '5060'),
  };
  const arAccount = dfnAccounts.find(a => a.code === '1020');
  const apAccount = dfnAccounts.find(a => a.code === '2010');

  for (let i = 0; i < 15; i++) {
    const entryDate = monthsAgo(i);
    const isRandomRevenue = i % 3 === 0;
    const desc = isRandomRevenue
      ? `Service revenue recognition - Q${Math.floor(i / 4) + 1} batch ${i + 1}`
      : `Operating expense payment - ${['Office', 'Salary', 'Utilities'][i % 3]} related`;
    const totalAmount = Math.floor(Math.random() * 12000) + 3000;

    const je = await prisma.journalEntry.create({
      data: {
        organizationId: dfnOrgId,
        entryNo: `JE-${y}-${String(i + 1).padStart(3, '0')}`,
        date: entryDate,
        description: desc,
        status: 'Posted',
      },
    });

    if (isRandomRevenue && cashAccount && revenueAccount) {
      await prisma.journalLine.createMany({
        data: [
          { journalEntryId: je.id, accountId: cashAccount.id, debit: totalAmount, memo: 'Cash received' },
          { journalEntryId: je.id, accountId: revenueAccount.id, credit: totalAmount, memo: 'Revenue recognized' },
        ],
      });
    } else if (cashAccount) {
      const expAcct = expenseAccts[['Office', 'Salary', 'Utilities'][i % 3] as keyof typeof expenseAccts];
      if (expAcct) {
        await prisma.journalLine.createMany({
          data: [
            { journalEntryId: je.id, accountId: expAcct.id, debit: totalAmount, memo: 'Expense incurred' },
            { journalEntryId: je.id, accountId: cashAccount.id, credit: totalAmount, memo: 'Cash payment' },
          ],
        });
      }
    }
  }

  // DirectFN Coupons & Discounts (must be created before Sales Orders which reference them)
  const [cpn1, cpn2, cpn3, cpn4] = await Promise.all([
    prisma.coupon.create({ data: { organizationId: dfnOrgId, code: 'WELCOME10', discountType: 'Percentage', discountValue: 10, minOrderAmount: 500, usageLimit: 100, usedCount: 0, startDate: monthsAgo(3), endDate: monthsAgo(-3), isActive: true } }),
    prisma.coupon.create({ data: { organizationId: dfnOrgId, code: 'SAVE50', discountType: 'Fixed', discountValue: 50, minOrderAmount: 1000, usageLimit: 50, usedCount: 5, startDate: monthsAgo(2), endDate: monthsAgo(-6), isActive: true } }),
    prisma.coupon.create({ data: { organizationId: dfnOrgId, code: 'FREESHIP', discountType: 'Fixed', discountValue: 25, minOrderAmount: 300, usageLimit: 200, usedCount: 12, startDate: monthsAgo(1), endDate: monthsAgo(-4), isActive: true } }),
    prisma.coupon.create({ data: { organizationId: dfnOrgId, code: 'FLASH20', discountType: 'Percentage', discountValue: 20, minOrderAmount: 2000, usageLimit: 25, usedCount: 0, startDate: monthsAgo(0), endDate: monthsAgo(-2), isActive: false } }),
  ]);

  const [disc1, disc2, disc3, disc4] = await Promise.all([
    prisma.discount.create({ data: { organizationId: dfnOrgId, name: 'Bulk Purchase 5%', type: 'Percentage', value: 5, minOrderAmount: 5000, maxDiscount: 500, isActive: true } }),
    prisma.discount.create({ data: { organizationId: dfnOrgId, name: 'Loyalty Discount', type: 'Percentage', value: 8, minOrderAmount: 3000, maxDiscount: 300, isActive: true } }),
    prisma.discount.create({ data: { organizationId: dfnOrgId, name: 'Seasonal Sale $100 Off', type: 'Fixed', value: 100, minOrderAmount: 2000, maxDiscount: 100, isActive: true } }),
    prisma.discount.create({ data: { organizationId: dfnOrgId, name: 'New Year Promo', type: 'Percentage', value: 15, minOrderAmount: 10000, maxDiscount: 2000, isActive: false } }),
  ]);

  // DirectFN Coupon Usages
  await prisma.couponUsage.createMany({
    data: [
      { couponId: cpn2.id, customerId: dfm.id, usedAt: monthsAgo(1) },
      { couponId: cpn2.id, customerId: tadawul.id, usedAt: monthsAgo(2) },
      { couponId: cpn2.id, customerId: adx.id, usedAt: monthsAgo(2) },
      { couponId: cpn2.id, customerId: qse.id, usedAt: monthsAgo(3) },
      { couponId: cpn2.id, customerId: ksf.id, usedAt: monthsAgo(3) },
      { couponId: cpn1.id, customerId: dfm.id, usedAt: monthsAgo(0) },
      { couponId: cpn1.id, customerId: tadawul.id, usedAt: monthsAgo(1) },
      { couponId: cpn3.id, customerId: adx.id, usedAt: monthsAgo(0) },
      { couponId: cpn3.id, customerId: qse.id, usedAt: monthsAgo(1) },
      { couponId: cpn3.id, customerId: ksf.id, usedAt: monthsAgo(2) },
    ],
  });

  // DirectFN Sales Orders (various statuses)
  const salesStatuses: Array<{ status: string; idx: number }> = [
    { status: 'Draft', idx: 0 }, { status: 'Confirmed', idx: 1 }, { status: 'Invoiced', idx: 2 },
    { status: 'Confirmed', idx: 3 }, { status: 'Draft', idx: 4 }, { status: 'Invoiced', idx: 5 },
    { status: 'Cancelled', idx: 6 },
  ];
  const dfnSaleProducts = [dp1, dp2, dp3, dp4, dp5, dp6];
  const dfnSaleCustomers = [dfm, tadawul, adx, qse, ksf];

  for (let i = 0; i < 7; i++) {
    const { status } = salesStatuses[i];
    const cust = dfnSaleCustomers[i % dfnSaleCustomers.length];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    let subtotal = 0;
    const itemsData: Array<{ productId: string; quantity: number; unitPrice: number; discount: number; taxRate: number; lineTotal: number }> = [];

    for (let j = 0; j < itemCount; j++) {
      const prod = dfnSaleProducts[(i + j) % dfnSaleProducts.length];
      const qty = Math.floor(Math.random() * 10) + 1;
      const price = Number(prod.sellingPrice);
      const lineTotal = qty * price;
      subtotal += lineTotal;
      itemsData.push({ productId: prod.id, quantity: qty, unitPrice: price, discount: 0, taxRate: 13, lineTotal });
    }

    const taxAmount = Math.round(subtotal * 0.13 * 100) / 100;
    const total = subtotal + taxAmount;

    // Apply coupon or discount to some orders (every 2nd order)
    const applyCoupon = i % 2 === 0 && i < 4 ? (i % 4 === 0 ? cpn1 : cpn2) : null;
    const applyDiscount = i % 3 === 0 && i >= 3 ? disc2 : null;
    let discountAmount = 0;
    if (applyCoupon) {
      discountAmount = applyCoupon.discountType === 'Percentage'
        ? Math.round(subtotal * Number(applyCoupon.discountValue) / 100 * 100) / 100
        : Math.min(Number(applyCoupon.discountValue), subtotal);
    }
    if (applyDiscount) {
      discountAmount = applyDiscount.type === 'Percentage'
        ? Math.round(subtotal * Number(applyDiscount.value) / 100 * 100) / 100
        : Math.min(Number(applyDiscount.value), subtotal);
    }

    const so = await prisma.salesOrder.create({
      data: {
        organizationId: dfnOrgId, orderNo: `SO-${y}-${String(i + 1).padStart(3, '0')}`,
        customerId: cust.id, subtotal, discountAmount, taxAmount, totalAmount: total - discountAmount,
        couponId: applyCoupon?.id, discountId: applyDiscount?.id,
        status, notes: `Sales order for ${cust.name}`,
      },
    });

    for (const item of itemsData) {
      await prisma.salesOrderItem.create({
        data: { salesOrderId: so.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, taxRate: item.taxRate, lineTotal: item.lineTotal },
      });
    }

    // Generate SalesInvoice for 'Invoiced' orders
    if (status === 'Invoiced') {
      const si = await prisma.salesInvoice.create({
        data: {
          organizationId: dfnOrgId, invoiceNo: `SI-${y}-${String(i + 1).padStart(3, '0')}`,
          salesOrderId: so.id, subtotal, discountAmount, taxAmount, totalAmount: total - discountAmount,
          dueAt: monthsAgo(i - 1), status: 'Unpaid',
        },
      });
      for (const item of itemsData) {
        await prisma.salesInvoiceItem.create({
          data: { salesInvoiceId: si.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, taxRate: item.taxRate, lineTotal: item.lineTotal },
        });
      }
    }
  }

  // DirectFN Sales Returns (on some invoiced orders)
  const dfnSalesInvoices = await prisma.salesInvoice.findMany({ where: { organizationId: dfnOrgId } });
  for (let i = 0; i < Math.min(3, dfnSalesInvoices.length); i++) {
    const si = dfnSalesInvoices[i];
    const siItems = await prisma.salesInvoiceItem.findMany({ where: { salesInvoiceId: si.id } });
    if (siItems.length === 0) continue;
    const returnItem = siItems[0];
    const returnQty = Math.min(returnItem.quantity, Math.floor(Math.random() * 2) + 1);
    const returnTotal = returnQty * Number(returnItem.unitPrice);

    const sr = await prisma.salesReturn.create({
      data: {
        organizationId: dfnOrgId, returnNo: `SR-${y}-${String(i + 1).padStart(3, '0')}`,
        salesInvoiceId: si.id, totalAmount: returnTotal, reason: 'Damaged on delivery', status: 'Approved',
      },
    });
    await prisma.salesReturnItem.create({
      data: { salesReturnId: sr.id, productId: returnItem.productId!, quantity: returnQty, unitPrice: Number(returnItem.unitPrice), lineTotal: returnTotal, reason: 'Defective product' },
    });
  }

  // DirectFN Purchase Orders (various statuses)
  const poStatuses: Array<{ status: string; idx: number }> = [
    { status: 'Draft', idx: 0 }, { status: 'Sent', idx: 1 }, { status: 'Partially Received', idx: 2 },
    { status: 'Received', idx: 3 }, { status: 'Sent', idx: 4 }, { status: 'Cancelled', idx: 5 },
  ];
  const dfnPOSuppliers = [oracle, cisco, dell, awsEmea, msft, oracle];

  for (let i = 0; i < 6; i++) {
    const { status } = poStatuses[i];
    const supp = dfnPOSuppliers[i];
    const prod = dfnSaleProducts[i % dfnSaleProducts.length];
    const qty = Math.floor(Math.random() * 20) + 5;
    const unitPrice = Number(prod.purchasePrice) * 1.1;
    const lineTotal = Math.round(qty * unitPrice * 100) / 100;
    const subtotal = lineTotal;
    const taxAmount = Math.round(subtotal * 0.13 * 100) / 100;

    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId: dfnOrgId, orderNo: `PO-${y}-${String(i + 1).padStart(3, '0')}`,
        supplierId: supp.id, subtotal, taxAmount, totalAmount: subtotal + taxAmount,
        status, expectedDate: monthsAgo(i - 1), notes: `Purchase order for ${prod.name}`,
      },
    });

    await prisma.purchaseOrderItem.create({
      data: { purchaseOrderId: po.id, productId: prod.id, quantity: qty, receivedQty: status === 'Received' ? qty : status === 'Partially Received' ? Math.floor(qty / 2) : 0, unitPrice, taxRate: 13, lineTotal },
    });

    // Goods Received for Received / Partially Received orders
    if (status === 'Received' || status === 'Partially Received') {
      const receivedQty = status === 'Received' ? qty : Math.floor(qty / 2);
      const grn = await prisma.goodsReceived.create({
        data: {
          organizationId: dfnOrgId, grnNo: `GRN-${y}-${String(i + 1).padStart(3, '0')}`,
          purchaseOrderId: po.id, status: 'Completed', receivedDate: monthsAgo(i), notes: `Goods received for PO-${y}-${String(i + 1).padStart(3, '0')}`,
        },
      });
      await prisma.goodsReceivedItem.create({
        data: { goodsReceivedId: grn.id, productId: prod.id, orderedQty: qty, receivedQty, acceptedQty: receivedQty, rejectedQty: 0 },
      });
    }
  }

  // DirectFN Supplier Returns
  const dfnReceivedPOs = await prisma.purchaseOrder.findMany({ where: { organizationId: dfnOrgId, status: { in: ['Received', 'Partially Received'] } } });
  for (let i = 0; i < Math.min(2, dfnReceivedPOs.length); i++) {
    const po = dfnReceivedPOs[i];
    const poItems = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });
    if (poItems.length === 0) continue;
    const retItem = poItems[0];
    const retQty = 1;
    const retTotal = retQty * Number(retItem.unitPrice);

    const sr = await prisma.supplierReturn.create({
      data: {
        organizationId: dfnOrgId, returnNo: `SRO-${y}-${String(i + 1).padStart(3, '0')}`,
        supplierId: po.supplierId, purchaseOrderId: po.id, totalAmount: retTotal, reason: 'Defective item received', status: 'Approved',
      },
    });
    await prisma.supplierReturnItem.create({
      data: { supplierReturnId: sr.id, productId: retItem.productId!, quantity: retQty, unitPrice: Number(retItem.unitPrice), lineTotal: retTotal, reason: 'Failed quality check' },
    });
  }

  // Fiscal Archives seeding removed

  // DirectFN User Screen Blocks (sample: block 'screens' for Store Manager, block 'plan' for Sales)
  const dfnUsers = await prisma.user.findMany({ where: { organizationId: dfnOrgId } });
  const dfnStoreUser = dfnUsers.find(u => u.email === 'store@directfn.com');
  const dfnSalesUser = dfnUsers.find(u => u.email === 'sales@directfn.com');
  if (dfnStoreUser) {
    await prisma.userScreenBlock.create({ data: { userId: dfnStoreUser.id, screenKey: 'plan' } });
    await prisma.userScreenBlock.create({ data: { userId: dfnStoreUser.id, screenKey: 'screens' } });
  }
  if (dfnSalesUser) {
    await prisma.userScreenBlock.create({ data: { userId: dfnSalesUser.id, screenKey: 'plan' } });
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

  // DirectFN Notifications (comprehensive)
  await prisma.notification.createMany({
    data: [
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Welcome to DirectFN Trading', message: 'Your tenant workspace is ready. Explore the dashboard.', type: 'info' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Invoice Overdue Alert', message: 'ADX invoice DFN-INV-2026-003 ($14,800) is overdue.', type: 'warning', referenceType: 'Invoice' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Payment Received', message: 'Saudi Tadawul Group completed payment of $48,500.', type: 'success', referenceType: 'Invoice' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Low Stock Alert', message: 'DirectFN Mobile Trading Dongle is out of stock.', type: 'warning', referenceType: 'Product' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Subscription Renewal', message: 'Your Pro plan renews in 30 days.', type: 'info' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Security Alert: New Login', message: 'New login detected from Dubai, UAE.', type: 'warning' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Sales Order Confirmed', message: 'SO-2026-002 for Saudi Tadawul Group has been confirmed.', type: 'success', referenceType: 'SalesOrder' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Purchase Order Sent', message: 'PO-2026-001 sent to Oracle Middle East.', type: 'info', referenceType: 'PurchaseOrder' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Goods Received', message: 'GRN-2026-001 - Stock received from Cisco Systems.', type: 'success', referenceType: 'PurchaseOrder' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Supplier Return Initiated', message: 'SRO-2026-001 - Defective items returned to Cisco.', type: 'warning', referenceType: 'PurchaseOrder' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Coupon Expiring Soon', message: 'Coupon "FLASH20" expires in 7 days.', type: 'warning' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Journal Entry Posted', message: 'JE-2026-008 - Operating expense payment posted.', type: 'info' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, title: 'Fiscal Year Closing', message: 'FY2025 archive generated. Net margin: 24.3%.', type: 'info' },
    ],
  });

  // DirectFN Audit Logs (comprehensive - covering all modules)
  await prisma.auditLog.createMany({
    data: [
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'LOGIN', entity: 'USER', entityId: dfnOrg.ownerId, details: JSON.stringify({ ip: '10.0.0.1', browser: 'Chrome 120' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'INVOICE', details: JSON.stringify({ invoiceNo: 'DFN-INV-2026-001', amount: 48500 }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'CUSTOMER', entityId: dfm.id, details: JSON.stringify({ name: 'Dubai Financial Market' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'UPDATE', entity: 'SUPPLIER', entityId: oracle.id, details: JSON.stringify({ name: 'Oracle Middle East', paymentTerms: 'Net 30' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'PAYMENT', details: JSON.stringify({ amount: 28000, type: 'Outbound' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'LOGIN', entity: 'USER', entityId: dfnOrg.ownerId, details: JSON.stringify({ ip: '10.0.0.2', browser: 'Safari 18' }), ipAddress: '10.0.0.2' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'UPDATE', entity: 'INVENTORY', entityId: dp5.id, details: JSON.stringify({ sku: dp5.sku, stockChange: -1, reason: 'Damaged' }), ipAddress: '10.0.0.1' },
      // Sales module actions
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'SALES_ORDER', details: JSON.stringify({ orderNo: 'SO-2026-001', customer: 'DFM', amount: 5994 }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'UPDATE', entity: 'SALES_ORDER', details: JSON.stringify({ orderNo: 'SO-2026-001', status: 'Confirmed' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'SALES_INVOICE', details: JSON.stringify({ invoiceNo: 'SI-2026-001', amount: 5994 }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'SALES_RETURN', details: JSON.stringify({ returnNo: 'SR-2026-001', reason: 'Damaged on delivery' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'COUPON', details: JSON.stringify({ code: 'WELCOME10', discount: '10%' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'DISCOUNT', details: JSON.stringify({ name: 'Bulk Purchase 5%', type: 'Percentage' }), ipAddress: '10.0.0.1' },
      // Purchase module actions
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'PURCHASE_ORDER', details: JSON.stringify({ orderNo: 'PO-2026-001', supplier: 'Oracle', amount: 7425 }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'UPDATE', entity: 'PURCHASE_ORDER', details: JSON.stringify({ orderNo: 'PO-2026-001', status: 'Sent' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'GOODS_RECEIVED', details: JSON.stringify({ grnNo: 'GRN-2026-001', poNo: 'PO-2026-001' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'SUPPLIER_RETURN', details: JSON.stringify({ returnNo: 'SRO-2026-001', reason: 'Defective item' }), ipAddress: '10.0.0.1' },
      // Accounting module actions
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'ACCOUNT', details: JSON.stringify({ code: '6010', name: 'Consulting Revenue' }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'JOURNAL_ENTRY', details: JSON.stringify({ entryNo: 'JE-2026-001', amount: 8500 }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'UPDATE', entity: 'JOURNAL_ENTRY', details: JSON.stringify({ entryNo: 'JE-2026-001', status: 'Posted' }), ipAddress: '10.0.0.1' },
      // Income & Expense actions
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'INCOME', details: JSON.stringify({ category: 'Services', amount: 15000 }), ipAddress: '10.0.0.1' },
      { organizationId: dfnOrgId, userId: dfnOrg.ownerId, action: 'CREATE', entity: 'EXPENSE', details: JSON.stringify({ category: 'Salary', amount: 12500 }), ipAddress: '10.0.0.1' },
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
