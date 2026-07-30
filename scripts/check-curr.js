const fs = require('fs');
const files = [
  'accounting/page.tsx',
  'income/page.tsx',
  'expenses/page.tsx',
  'payments/page.tsx',
  'invoices/page.tsx',
  'invoices/[id]/page.tsx',
  'sales/page.tsx',
  'sales/pos/page.tsx',
  'sales/invoices/page.tsx',
  'sales/returns/page.tsx',
  'sales/discounts/page.tsx',
  'sales/coupons/page.tsx',
  'purchases/page.tsx',
  'purchases/invoices/page.tsx',
  'purchases/returns/page.tsx',
  'purchases/goods-received/page.tsx',
  'customers/page.tsx',
  'suppliers/page.tsx',
  'products/page.tsx',
];
for (const f of files) {
  const p = `frontend/src/app/(dashboard)/dashboard/${f}`;
  if (!fs.existsSync(p)) { console.log(`MISS: ${f}`); continue; }
  const c = fs.readFileSync(p, 'utf8');
  const usd = c.includes("currency: 'USD'");
  const pkr = c.includes("currency: 'PKR'");
  console.log(`${f}: USD=${usd} PKR=${pkr} len=${c.length}`);
}
