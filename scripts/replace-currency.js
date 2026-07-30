const fs = require('fs');
const path = require('path');

const businessDirs = [
  'frontend/src/app/(dashboard)/dashboard',
  'frontend/src/app/print',
  'frontend/src/app/admin',
  'frontend/src/components/invoices',
  'frontend/src/components/management',
  'frontend/src/app/(dashboard)',
];

const files = [];
for (const dir of businessDirs) {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) walkDir(fullPath, files);
}

function walkDir(dir, acc) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, acc);
    else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) acc.push(p);
  }
}

console.log('Files found:', files.length);

let changed = 0;

for (const file of files) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); }
  catch { continue; }
  if (!content || content.length === 0) continue;
  let original = content;

  // SAFE replacements only:

  // 1. Intl currency: 'USD' -> 'PKR'
  content = content.replace(/currency: 'USD'/g, "currency: 'PKR'");
  // 2. Intl locale: 'en-US' -> 'en-PK'
  content = content.replace(/'en-US'/g, "'en-PK'");
  // 3. Template literal `$${ -> `Rs. ${ (dollar sign + template expr)
  content = content.replace(/`\$\{/g, '`Rs. ${');
  // 4. JSX: ${Number(...).toFixed( -> Rs. {Number(...).toFixed(
  content = content.replace(/\$\{Number\(/g, 'Rs. {Number(');
  // 5. JSX: ${variable.toFixed( or ${variable.toLocaleString( -> Rs. {variable.toFixed(
  content = content.replace(/\$\{([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\.(toFixed|toLocaleString)\(/g, 'Rs. {$1.$2(');
  // 6. Static $500, $32.1K etc (dollar-digit patterns, not ${)
  content = content.replace(/(?<![\w`])\$(\d[\d,]*\.?\d*[KMB]?)/g, 'Rs. $1');
  // 7. Fix "Rs. Rs." double
  content = content.replace(/Rs\. Rs\. /g, 'Rs. ');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    const rel = path.relative(path.join(__dirname, '..'), file);
    console.log('  OK:', rel);
    changed++;
  }
}

console.log(`\nUpdated ${changed} files.`);
