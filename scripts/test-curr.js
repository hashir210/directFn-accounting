const fs = require('fs');
const content = fs.readFileSync('../frontend/src/app/(dashboard)/dashboard/accounting/page.tsx', 'utf8');
console.log('Has USD:', content.includes("currency: 'USD'"));
console.log('Has en-US:', content.includes("'en-US'"));
console.log('Has $${:', content.includes('`$${'));
