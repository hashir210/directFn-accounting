import prisma from '../config/db';
import bcrypt from 'bcrypt';

async function main() {
  console.log('[seed]: clearing existing demo data...');
  await prisma.notification.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  const hashed = await bcrypt.hash('Password123!', 10);

  console.log('[seed]: creating users...');
  const admin = await prisma.user.create({
    data: { email: 'admin@finflow.com', password: hashed, name: 'Admin User', role: 'admin', emailVerified: true },
  });
  await prisma.user.create({
    data: { email: 'manager@finflow.com', password: hashed, name: 'Manager User', role: 'manager', emailVerified: true },
  });
  await prisma.user.create({
    data: { email: 'staff@finflow.com', password: hashed, name: 'Staff User', role: 'staff', emailVerified: true },
  });

  console.log('[seed]: creating customers...');
  const [apex, horizon, acme, stark, initech, vercel, aws, hq] = await Promise.all([
    prisma.customer.create({ data: { name: 'Apex Global Systems', email: 'billing@apexglobal.com', phone: '+1 202 555 0100' } }),
    prisma.customer.create({ data: { name: 'Horizon Ventures', email: 'finance@horizon.vc' } }),
    prisma.customer.create({ data: { name: 'Acme Corporation', email: 'accounting@acme.com' } }),
    prisma.customer.create({ data: { name: 'Stark Industries', email: 'pepper@stark.com' } }),
    prisma.customer.create({ data: { name: 'Initech LLC', email: 'ap@initech.com' } }),
    prisma.customer.create({ data: { name: 'Vercel Enterprise', email: 'billing@vercel.com' } }),
    prisma.customer.create({ data: { name: 'Direct Hosting AWS', email: 'bills@aws.com' } }),
    prisma.customer.create({ data: { name: 'HQ Office Co-working', email: 'rent@hqoffice.com' } }),
  ]);

  const now = new Date();
  const y = now.getFullYear();

  console.log('[seed]: creating invoices...');
  await prisma.invoice.createMany({
    data: [
      { invoiceNo: 'INV-2026-001', customerId: apex.id, amount: 24500, status: 'paid', issuedAt: new Date(y, 0, 2), dueAt: new Date(y, 0, 20), paidAt: new Date(y, 0, 15) },
      { invoiceNo: 'INV-2026-002', customerId: horizon.id, amount: 18700, status: 'overdue', issuedAt: new Date(y, 0, 8), dueAt: new Date(y, 0, 28) },
      { invoiceNo: 'INV-2026-003', customerId: acme.id, amount: 15300, status: 'pending', issuedAt: new Date(y, 1, 11), dueAt: new Date(y, 1, 28) },
      { invoiceNo: 'INV-2026-004', customerId: initech.id, amount: 8900, status: 'pending', issuedAt: new Date(y, 1, 12), dueAt: new Date(y, 1, 28) },
      { invoiceNo: 'INV-2026-005', customerId: stark.id, amount: 42000, status: 'paid', issuedAt: new Date(y, 1, 14), dueAt: new Date(y, 1, 28), paidAt: new Date(y, 1, 20) },
      { invoiceNo: 'INV-2026-006', customerId: apex.id, amount: 9800, status: 'paid', issuedAt: new Date(y, 2, 3), dueAt: new Date(y, 2, 20), paidAt: new Date(y, 2, 10) },
      { invoiceNo: 'INV-2026-007', customerId: acme.id, amount: 6200, status: 'paid', issuedAt: new Date(y, 3, 5), dueAt: new Date(y, 3, 22), paidAt: new Date(y, 3, 12) },
      { invoiceNo: 'INV-2026-008', customerId: horizon.id, amount: 13400, status: 'pending', issuedAt: new Date(y, 4, 2), dueAt: new Date(y, 4, 20) },
      { invoiceNo: 'INV-2026-009', customerId: stark.id, amount: 27500, status: 'paid', issuedAt: new Date(y, 5, 1), dueAt: new Date(y, 5, 20), paidAt: new Date(y, 5, 8) },
      { invoiceNo: 'INV-2026-010', customerId: vercel.id, amount: 1200, status: 'pending', issuedAt: new Date(y, 5, 10), dueAt: new Date(y, 5, 25) },
    ],
  });

  console.log('[seed]: creating expenses...');
  await prisma.expense.createMany({
    data: [
      { category: 'Hosting', description: 'Direct Hosting AWS', amount: 4800, date: new Date(y, 0, 4) },
      { category: 'Software', description: 'Vercel Enterprise Billing', amount: 1200, date: new Date(y, 1, 10) },
      { category: 'Rent', description: 'HQ Office Co-working Rent', amount: 3500, date: new Date(y, 1, 13) },
      { category: 'Salaries', description: 'Engineering payroll', amount: 22000, date: new Date(y, 2, 1) },
      { category: 'Marketing', description: 'Ad campaign', amount: 6400, date: new Date(y, 3, 15) },
      { category: 'Utilities', description: 'Electricity & internet', amount: 1800, date: new Date(y, 4, 2) },
      { category: 'Travel', description: 'Client onsite', amount: 3200, date: new Date(y, 5, 12) },
    ],
  });

  console.log('[seed]: creating products...');
  await prisma.product.createMany({
    data: [
      { name: 'FinFlow POS Terminal V2', sku: 'FF-POS-V2', category: 'Hardware', stockQuantity: 3, lowStockThreshold: 10, unitPrice: 349.0 },
      { name: 'Thermal Receipt Paper Roll', sku: 'FF-TRP-80', category: 'Consumables', stockQuantity: 8, lowStockThreshold: 25, unitPrice: 12.5 },
      { name: 'FinFlow QR Stand Metallic', sku: 'FF-QRS-MET', category: 'Hardware', stockQuantity: 12, lowStockThreshold: 15, unitPrice: 24.0 },
      { name: 'Backup Battery Pack Pro', sku: 'FF-BBP-PRO', category: 'Hardware', stockQuantity: 45, lowStockThreshold: 15, unitPrice: 59.0 },
      { name: 'FinFlow NFC Reader', sku: 'FF-NFC-R1', category: 'Hardware', stockQuantity: 0, lowStockThreshold: 8, unitPrice: 89.0 },
    ],
  });

  console.log('[seed]: creating bank accounts...');
  await prisma.bankAccount.createMany({
    data: [
      { name: 'Main Checking', accountNumber: 'FINFLOW-ACC-001', bankName: 'FinBank', balance: 185000, currency: 'USD', isActive: true },
      { name: 'Savings', accountNumber: 'FINFLOW-ACC-002', bankName: 'FinBank', balance: 63000, currency: 'USD', isActive: true },
    ],
  });

  console.log('[seed]: creating notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, title: 'Low Stock Warning', message: 'FinFlow NFC Reader is out of stock.', type: 'warning' },
      { userId: admin.id, title: 'Invoice Paid', message: 'Stark Industries completed payment for INV-2026-009.', type: 'success' },
      { userId: admin.id, title: 'Expense Pending', message: 'Travel expense of $3,200.00 requires approval.', type: 'info' },
      { userId: admin.id, title: 'System Update', message: 'Platform migrated to Core Engine v1.0.', type: 'info' },
    ],
  });

  console.log('[seed]: done. Demo accounts -> admin@finflow.com / manager@finflow.com / staff@finflow.com (Password123!)');
}

main()
  .catch((e) => {
    console.error('[seed]: failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
