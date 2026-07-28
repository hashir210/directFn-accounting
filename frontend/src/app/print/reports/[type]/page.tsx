'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const titles: Record<string, string> = {
  'profit-loss': 'Profit & Loss',
  'sales': 'Sales Report',
  'expenses': 'Expense Report',
  'balance-sheet': 'Balance Sheet',
  'cash-flow': 'Cash Flow',
  'income': 'Income Report',
  'purchases': 'Purchase Report',
  'customer-statement': 'Customer Statement',
  'supplier-statement': 'Supplier Statement',
  'inventory': 'Inventory Valuation',
  'tax': 'Tax Report',
};

const supportsDateFilter = ['profit-loss', 'sales', 'expenses', 'cash-flow', 'income', 'purchases', 'tax'];

const tokenResponses: Record<string, Promise<any>> = {};

function apiFetch(url: string, token?: string): Promise<any> {
  const cacheKey = `${url}|${token || ''}`;
  if (cacheKey in tokenResponses) return tokenResponses[cacheKey];

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const promise = fetch(url, { headers }).then(async (res) => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'API request failed');
    return json.data;
  });

  tokenResponses[cacheKey] = promise;
  return promise;
}

export default function PrintReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params?.type as string;

  const token = searchParams?.get('token') || '';
  const startDate = searchParams?.get('startDate') || '';
  const endDate = searchParams?.get('endDate') || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);

      const queryString = query.toString();
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/reports/${type}${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch(url, token);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [type, startDate, endDate, token]);

  useEffect(() => {
    if (type) fetchReport();
  }, [type, fetchReport]);

  useEffect(() => {
    if (!loading && !error) {
      const el = document.querySelector('[data-report-loaded]');
      if (el) el.setAttribute('data-report-loaded', 'true');
    }
  }, [loading, error]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', color: '#6B7280' }}>
        Loading report...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', color: '#EF4444' }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const reportTitle = titles[type] || 'Report';
  const reportSubtitle = `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

  return (
    <div data-report-loaded="true" style={{ fontFamily: 'system-ui, sans-serif', padding: '20px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #111827' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{reportTitle}</h1>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0 0' }}>{reportSubtitle}</p>
      </div>

      {type === 'profit-loss' && <ProfitLossSummary data={data} />}
      {type === 'sales' && <SalesSummary data={data} />}
      {type === 'expenses' && <ExpenseSummary data={data} />}
      {type === 'balance-sheet' && <BalanceSheetSummary data={data} />}
      {type === 'cash-flow' && <CashFlowSummary data={data} />}
      {type === 'income' && <IncomeSummary data={data} />}
      {type === 'purchases' && <PurchaseSummary data={data} />}
      {type === 'customer-statement' && <CustomerStatementSummary data={data} />}
      {type === 'supplier-statement' && <SupplierStatementSummary data={data} />}
      {type === 'inventory' && <InventorySummary data={data} />}
      {type === 'tax' && <TaxSummary data={data} />}

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #D1D5DB' }}>
        <ChartSection type={type} data={data} />
      </div>

      {data.tableData && data.tableData.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Data Breakdown</h2>
          <TableSection headers={['Entity', 'Value']} rows={data.tableData.map((r: any) => [r.name || r.category || r.month, `$${(r.totalAmount || r.balance || r.total || 0).toLocaleString()}`])} />
        </div>
      )}

      {data.accounts && data.accounts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Account Breakdown</h2>
          <TableSection headers={['Account', 'Balance']} rows={data.accounts.map((r: any) => [r.name, `$${r.balance.toLocaleString()}`])} />
        </div>
      )}
    </div>
  );
}

function CardSummary({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', margin: 0 }}>{label}</p>
      <h3 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0 0', color: color || '#111827' }}>{value}</h3>
    </div>
  );
}

function SummaryGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>{children}</div>;
}

function ProfitLossSummary({ data }: { data: any }) {
  const netColor = data.summary.netProfit >= 0 ? '#10B981' : '#EF4444';
  return (
    <SummaryGrid>
      <CardSummary label="Total Revenue" value={`$${data.summary.totalRevenue.toLocaleString()}`} />
      <CardSummary label="Total Expenses" value={`$${data.summary.totalExpenses.toLocaleString()}`} color="#EF4444" />
      <CardSummary label="Net Profit" value={`$${data.summary.netProfit.toLocaleString()}`} color={netColor} />
    </SummaryGrid>
  );
}

function SalesSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Sales" value={`$${data.summary.totalSales.toLocaleString()}`} />
      <CardSummary label="Total Customers" value={data.summary.totalCustomers.toString()} />
      <CardSummary label="Invoices Generated" value={data.summary.totalInvoices.toString()} />
    </SummaryGrid>
  );
}

function ExpenseSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Expenses" value={`$${data.summary.totalExpenses.toLocaleString()}`} color="#EF4444" />
      <CardSummary label="Categories" value={data.summary.totalCategories.toString()} />
      <CardSummary label="Transactions" value={data.summary.totalTransactions.toString()} />
    </SummaryGrid>
  );
}

function BalanceSheetSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Assets" value={`$${data.summary.totalAssets.toLocaleString()}`} />
      <CardSummary label="Total Liabilities" value={`$${data.summary.totalLiabilities.toLocaleString()}`} color="#EF4444" />
      <CardSummary label="Equity" value={`$${data.summary.equity.toLocaleString()}`} color="#10B981" />
    </SummaryGrid>
  );
}

function CashFlowSummary({ data }: { data: any }) {
  const netColor = data.summary.netCashFlow >= 0 ? '#10B981' : '#EF4444';
  return (
    <SummaryGrid>
      <CardSummary label="Total Inflow" value={`$${data.summary.totalInflow.toLocaleString()}`} color="#10B981" />
      <CardSummary label="Total Outflow" value={`$${data.summary.totalOutflow.toLocaleString()}`} color="#EF4444" />
      <CardSummary label="Net Cash Flow" value={`$${data.summary.netCashFlow.toLocaleString()}`} color={netColor} />
    </SummaryGrid>
  );
}

function IncomeSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Income" value={`$${data.summary.totalIncome.toLocaleString()}`} />
      <CardSummary label="Total Invoices" value={data.summary.totalInvoices.toString()} />
      <CardSummary label="Avg per Invoice" value={`$${data.summary.averagePerInvoice.toFixed(2)}`} />
    </SummaryGrid>
  );
}

function PurchaseSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Purchases" value={`$${data.summary.totalPurchases.toLocaleString()}`} />
      <CardSummary label="Total Bills" value={data.summary.totalBills.toString()} />
      <CardSummary label="Outstanding" value={`$${data.summary.outstandingBalance.toLocaleString()}`} color="#EF4444" />
    </SummaryGrid>
  );
}

function CustomerStatementSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Billed" value={`$${data.summary.totalBilled.toLocaleString()}`} />
      <CardSummary label="Total Paid" value={`$${data.summary.totalPaid.toLocaleString()}`} color="#10B981" />
      <CardSummary label="Outstanding" value={`$${data.summary.totalBalance.toLocaleString()}`} color={data.summary.totalBalance > 0 ? '#EF4444' : '#111827'} />
    </SummaryGrid>
  );
}

function SupplierStatementSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Billed" value={`$${data.summary.totalBilled.toLocaleString()}`} />
      <CardSummary label="Total Paid" value={`$${data.summary.totalPaid.toLocaleString()}`} color="#10B981" />
      <CardSummary label="Outstanding" value={`$${data.summary.totalBalance.toLocaleString()}`} color={data.summary.totalBalance > 0 ? '#EF4444' : '#111827'} />
    </SummaryGrid>
  );
}

function InventorySummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Total Value" value={`$${data.summary.totalValue.toLocaleString()}`} />
      <CardSummary label="Total Products" value={data.summary.totalProducts.toString()} />
      <CardSummary label="Low Stock Items" value={data.summary.lowStockCount.toString()} color={data.summary.lowStockCount > 0 ? '#EF4444' : '#10B981'} />
    </SummaryGrid>
  );
}

function TaxSummary({ data }: { data: any }) {
  return (
    <SummaryGrid>
      <CardSummary label="Tax Collected" value={`$${data.summary.totalTaxCollected.toLocaleString()}`} />
      <CardSummary label="Taxable Sales" value={`$${data.summary.totalTaxableSales.toLocaleString()}`} />
      <CardSummary label="Avg Tax Rate" value={`${data.summary.averageTaxRate.toFixed(2)}%`} />
    </SummaryGrid>
  );
}

function ChartSection({ type, data }: { type: string; data: any }) {
  return (
    <div style={{ height: 350, width: '100%' }}>
      {type === 'profit-loss' && data.chartData && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val: number) => `$${val}`} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend iconType="circle" />
            <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {type === 'sales' && data.chartData && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val: number) => `$${val}`} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={100} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="sales" name="Sales Volume" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {type === 'expenses' && data.chartData && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={5} dataKey="value" label>
              {data.chartData.map((_: any, index: number) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      )}
      {type === 'balance-sheet' && data.accounts && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.accounts}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val: number) => `$${val}`} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend iconType="circle" />
            <Bar dataKey="balance" name="Balance" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {type === 'cash-flow' && data.chartData && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val: number) => `$${val}`} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend iconType="circle" />
            <Area type="monotone" dataKey="inflow" name="Inflow" fill="#10B981" stroke="#10B981" fillOpacity={0.2} strokeWidth={2} />
            <Area type="monotone" dataKey="outflow" name="Outflow" fill="#EF4444" stroke="#EF4444" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      {type === 'income' && data.chartData && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val: number) => `$${val}`} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="total" name="Income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {type === 'purchases' && data.chartData && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val: number) => `$${val}`} />
            <YAxis dataKey="supplier" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={100} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="totalAmount" name="Purchases" fill="#F59E0B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {type === 'inventory' && data.lowStockItems && data.lowStockItems.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.lowStockItems}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="stock" name="Current Stock" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {type === 'tax' && data.chartData && data.chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="productName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val: number) => `$${val}`} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend iconType="circle" />
            <Bar dataKey="taxableAmount" name="Taxable Amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="taxAmount" name="Tax Amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {(['customer-statement', 'supplier-statement'].includes(type) || (type === 'inventory' && (!data.lowStockItems || data.lowStockItems.length === 0))) && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 14 }}>
          Table data available in the breakdown section
        </div>
      )}
    </div>
  );
}

function TableSection({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #111827' }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '8px 12px', textAlign: i > 0 ? 'right' : 'left', fontWeight: 700, color: '#111827' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ borderBottom: '1px solid #E5E7EB' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '8px 12px', textAlign: ci > 0 ? 'right' : 'left', color: ci > 0 ? '#111827' : '#4B5563' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}