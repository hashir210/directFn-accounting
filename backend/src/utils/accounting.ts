import { Decimal } from '@prisma/client/runtime/library';

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const EXPENSE_CATEGORIES = ['Office', 'Salary', 'Utilities', 'Fuel', 'Internet', 'Miscellaneous'] as const;
export const INCOME_CATEGORIES = ['Sales', 'Services', 'Investment', 'Other Income'] as const;

export function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export function isDebitNormal(type: string): boolean {
  return type === 'ASSET' || type === 'EXPENSE';
}

export function computeBalance(type: string, totalDebit: number, totalCredit: number): number {
  if (isDebitNormal(type)) return totalDebit - totalCredit;
  return totalCredit - totalDebit;
}

export const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Assets', type: 'ASSET', parentCode: null, isSystem: true },
  { code: '1010', name: 'Cash', type: 'ASSET', parentCode: '1000', isSystem: true },
  { code: '1020', name: 'Accounts Receivable', type: 'ASSET', parentCode: '1000', isSystem: true },
  { code: '1030', name: 'Inventory', type: 'ASSET', parentCode: '1000', isSystem: true },
  { code: '2000', name: 'Liabilities', type: 'LIABILITY', parentCode: null, isSystem: true },
  { code: '2010', name: 'Accounts Payable', type: 'LIABILITY', parentCode: '2000', isSystem: true },
  { code: '3000', name: 'Equity', type: 'EQUITY', parentCode: null, isSystem: true },
  { code: '3010', name: "Owner's Equity", type: 'EQUITY', parentCode: '3000', isSystem: true },
  { code: '3020', name: 'Retained Earnings', type: 'EQUITY', parentCode: '3000', isSystem: true },
  { code: '4000', name: 'Income', type: 'INCOME', parentCode: null, isSystem: true },
  { code: '4010', name: 'Sales', type: 'INCOME', parentCode: '4000', isSystem: true },
  { code: '4020', name: 'Services', type: 'INCOME', parentCode: '4000', isSystem: true },
  { code: '4030', name: 'Investment', type: 'INCOME', parentCode: '4000', isSystem: true },
  { code: '4040', name: 'Other Income', type: 'INCOME', parentCode: '4000', isSystem: true },
  { code: '5000', name: 'Expenses', type: 'EXPENSE', parentCode: null, isSystem: true },
  { code: '5010', name: 'Office', type: 'EXPENSE', parentCode: '5000', isSystem: true },
  { code: '5020', name: 'Salary', type: 'EXPENSE', parentCode: '5000', isSystem: true },
  { code: '5030', name: 'Utilities', type: 'EXPENSE', parentCode: '5000', isSystem: true },
  { code: '5040', name: 'Fuel', type: 'EXPENSE', parentCode: '5000', isSystem: true },
  { code: '5050', name: 'Internet', type: 'EXPENSE', parentCode: '5000', isSystem: true },
  { code: '5060', name: 'Miscellaneous', type: 'EXPENSE', parentCode: '5000', isSystem: true },
] as const;

export const EXPENSE_CATEGORY_ACCOUNT_CODE: Record<string, string> = {
  Office: '5010',
  Salary: '5020',
  Utilities: '5030',
  Fuel: '5040',
  Internet: '5050',
  Miscellaneous: '5060',
};

export const INCOME_CATEGORY_ACCOUNT_CODE: Record<string, string> = {
  Sales: '4010',
  Services: '4020',
  Investment: '4030',
  'Other Income': '4040',
};
