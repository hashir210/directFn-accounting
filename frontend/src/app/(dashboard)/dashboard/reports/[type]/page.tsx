'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Loader2, TrendingUp, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import apiFetch from '@/lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

export default function ReportViewerPage() {
  const router = useRouter();
  const params = useParams();
  const type = params?.type as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const supportsDateFilter = ['profit-loss', 'sales', 'expenses', 'cash-flow', 'income', 'purchases', 'tax'].includes(type);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (startDate) query.set('startDate', startDate);
        if (endDate) query.set('endDate', endDate);
        
        const res = await apiFetch(`/api/v1/reports/${type}?${query.toString()}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load report', err);
      } finally {
        setLoading(false);
      }
    };
    if (type) fetchReport();
  }, [type, startDate, endDate]);

  const handleExportCSV = () => {
    if (!data) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    switch (type) {
      case 'profit-loss':
        csvContent += 'Metric,Value\n';
        csvContent += `Total Revenue,${data.summary.totalRevenue}\nTotal Expenses,${data.summary.totalExpenses}\nNet Profit,${data.summary.netProfit}\nProfit Margin,${data.summary.profitMargin}%\n`;
        break;
      case 'sales':
        csvContent += 'Customer,Total Sales\n';
        data.tableData?.forEach((row: any) => { csvContent += `"${row.name}",${row.totalAmount}\n`; });
        break;
      case 'expenses':
        csvContent += 'Category,Total Amount\n';
        data.tableData?.forEach((row: any) => { csvContent += `"${row.category}",${row.totalAmount}\n`; });
        break;
      case 'balance-sheet':
        csvContent += 'Account,Balance\n';
        data.accounts?.forEach((row: any) => { csvContent += `"${row.name}",${row.balance}\n`; });
        break;
      case 'cash-flow':
        csvContent += 'Month,Inflow,Outflow,Net\n';
        data.chartData?.forEach((row: any) => { csvContent += `${row.month},${row.inflow},${row.outflow},${row.net}\n`; });
        break;
      case 'income':
        csvContent += 'Month,Total Income,Count\n';
        data.chartData?.forEach((row: any) => { csvContent += `${row.month},${row.total},${row.count}\n`; });
        break;
      case 'purchases':
        csvContent += 'Supplier,Total Amount,Balance\n';
        data.chartData?.forEach((row: any) => { csvContent += `"${row.supplier}",${row.totalAmount},${row.totalAmount - row.paidAmount}\n`; });
        break;
      case 'customer-statement':
        csvContent += 'Customer,Total Billed,Total Paid,Balance\n';
        data.tableData?.forEach((row: any) => { csvContent += `"${row.name}",${row.totalBilled},${row.totalPaid},${row.balance}\n`; });
        break;
      case 'supplier-statement':
        csvContent += 'Supplier,Total Billed,Total Paid,Balance\n';
        data.tableData?.forEach((row: any) => { csvContent += `"${row.name}",${row.totalBilled},${row.totalPaid},${row.balance}\n`; });
        break;
      case 'inventory':
        csvContent += 'Product,SKU,Stock,Value\n';
        data.lowStockItems?.forEach((row: any) => { csvContent += `"${row.name}",${row.sku},${row.stock},${row.value}\n`; });
        break;
      case 'tax':
        csvContent += 'Product,Taxable Amount,Tax Amount\n';
        data.chartData?.forEach((row: any) => { csvContent += `"${row.productName}",${row.taxableAmount},${row.taxAmount}\n`; });
        break;
    }

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${type}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">{titles[type] || 'Report'}</h1>
            <p className="text-muted-foreground mt-1">Real-time aggregated financial data.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {supportsDateFilter && (
            <div className="flex items-center space-x-2 bg-card p-1 rounded-md border border-border/50">
              <Input type="date" className="h-9 border-none bg-transparent" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-muted-foreground">-</span>
              <Input type="date" className="h-9 border-none bg-transparent" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {type === 'profit-loss' && (
              <>
                <CardSummary label="Total Revenue" value={`$${data.summary.totalRevenue.toLocaleString()}`} />
                <CardSummary label="Total Expenses" value={`$${data.summary.totalExpenses.toLocaleString()}`} />
                <CardSummary label="Net Profit" value={`$${data.summary.netProfit.toLocaleString()}`} color={data.summary.netProfit >= 0 ? 'text-emerald-500' : 'text-destructive'} />
              </>
            )}
            {type === 'sales' && (
              <>
                <CardSummary label="Total Sales" value={`$${data.summary.totalSales.toLocaleString()}`} />
                <CardSummary label="Total Customers" value={data.summary.totalCustomers.toString()} />
                <CardSummary label="Invoices Generated" value={data.summary.totalInvoices.toString()} />
              </>
            )}
            {type === 'expenses' && (
              <>
                <CardSummary label="Total Expenses" value={`$${data.summary.totalExpenses.toLocaleString()}`} />
                <CardSummary label="Categories" value={data.summary.totalCategories.toString()} />
                <CardSummary label="Transactions" value={data.summary.totalTransactions.toString()} />
              </>
            )}
            {type === 'balance-sheet' && (
              <>
                <CardSummary label="Total Assets" value={`$${data.summary.totalAssets.toLocaleString()}`} />
                <CardSummary label="Total Liabilities" value={`$${data.summary.totalLiabilities.toLocaleString()}`} color="text-destructive" />
                <CardSummary label="Equity" value={`$${data.summary.equity.toLocaleString()}`} color="text-emerald-500" />
              </>
            )}
            {type === 'cash-flow' && (
              <>
                <CardSummary label="Total Inflow" value={`$${data.summary.totalInflow.toLocaleString()}`} color="text-emerald-500" />
                <CardSummary label="Total Outflow" value={`$${data.summary.totalOutflow.toLocaleString()}`} color="text-destructive" />
                <CardSummary label="Net Cash Flow" value={`$${data.summary.netCashFlow.toLocaleString()}`} color={data.summary.netCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive'} />
              </>
            )}
            {type === 'income' && (
              <>
                <CardSummary label="Total Income" value={`$${data.summary.totalIncome.toLocaleString()}`} />
                <CardSummary label="Total Invoices" value={data.summary.totalInvoices.toString()} />
                <CardSummary label="Avg per Invoice" value={`$${data.summary.averagePerInvoice.toFixed(2)}`} />
              </>
            )}
            {type === 'purchases' && (
              <>
                <CardSummary label="Total Purchases" value={`$${data.summary.totalPurchases.toLocaleString()}`} />
                <CardSummary label="Total Bills" value={data.summary.totalBills.toString()} />
                <CardSummary label="Outstanding" value={`$${data.summary.outstandingBalance.toLocaleString()}`} color="text-destructive" />
              </>
            )}
            {type === 'customer-statement' && (
              <>
                <CardSummary label="Total Billed" value={`$${data.summary.totalBilled.toLocaleString()}`} />
                <CardSummary label="Total Paid" value={`$${data.summary.totalPaid.toLocaleString()}`} color="text-emerald-500" />
                <CardSummary label="Outstanding" value={`$${data.summary.totalBalance.toLocaleString()}`} color={data.summary.totalBalance > 0 ? 'text-destructive' : ''} />
              </>
            )}
            {type === 'supplier-statement' && (
              <>
                <CardSummary label="Total Billed" value={`$${data.summary.totalBilled.toLocaleString()}`} />
                <CardSummary label="Total Paid" value={`$${data.summary.totalPaid.toLocaleString()}`} color="text-emerald-500" />
                <CardSummary label="Outstanding" value={`$${data.summary.totalBalance.toLocaleString()}`} color={data.summary.totalBalance > 0 ? 'text-destructive' : ''} />
              </>
            )}
            {type === 'inventory' && (
              <>
                <CardSummary label="Total Value" value={`$${data.summary.totalValue.toLocaleString()}`} />
                <CardSummary label="Total Products" value={data.summary.totalProducts.toString()} />
                <CardSummary label="Low Stock Items" value={data.summary.lowStockCount.toString()} color={data.summary.lowStockCount > 0 ? 'text-destructive' : 'text-emerald-500'} />
              </>
            )}
            {type === 'tax' && (
              <>
                <CardSummary label="Tax Collected" value={`$${data.summary.totalTaxCollected.toLocaleString()}`} />
                <CardSummary label="Taxable Sales" value={`$${data.summary.totalTaxableSales.toLocaleString()}`} />
                <CardSummary label="Avg Tax Rate" value={`${data.summary.averageTaxRate.toFixed(2)}%`} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader><CardTitle>Visualization</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {type === 'profit-loss' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'sales' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} tickLine={false} width={100} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="sales" name="Sales Volume" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'expenses' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                          {data.chartData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'balance-sheet' && data.accounts && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.accounts}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="balance" name="Balance" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'cash-flow' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="inflow" name="Inflow" fill="#10b981" stroke="#10b981" fillOpacity={0.2} strokeWidth={2} />
                        <Area type="monotone" dataKey="outflow" name="Outflow" fill="#f43f5e" stroke="#f43f5e" fillOpacity={0.2} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'income' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="total" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'purchases' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <YAxis dataKey="supplier" type="category" stroke="#6b7280" fontSize={12} tickLine={false} width={100} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="totalAmount" name="Purchases" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'inventory' && data.lowStockItems && data.lowStockItems.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.lowStockItems}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="stock" name="Current Stock" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'tax' && data.chartData && data.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="productName" stroke="#6b7280" fontSize={12} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="taxableAmount" name="Taxable Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="taxAmount" name="Tax Amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {(['customer-statement', 'supplier-statement'].includes(type) || (type === 'inventory' && (!data.lowStockItems || data.lowStockItems.length === 0))) && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Table data available in the breakdown panel</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 shadow-sm border-border/50">
              <CardHeader><CardTitle>Data Breakdown</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {type === 'profit-loss' ? 'Metric' :
                         type === 'sales' ? 'Customer' :
                         type === 'expenses' ? 'Category' :
                         type === 'balance-sheet' ? 'Account' :
                         type === 'income' ? 'Month' :
                         type === 'purchases' ? 'Supplier' :
                         type === 'customer-statement' ? 'Customer' :
                         type === 'supplier-statement' ? 'Supplier' :
                         type === 'inventory' ? 'Product' :
                         type === 'tax' ? 'Product' : 'Entity'}
                      </TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {type === 'profit-loss' && (
                      <>
                        <RowItem label="Total Revenue" value={`$${data.summary.totalRevenue.toLocaleString()}`} />
                        <RowItem label="Total Expenses" value={`$${data.summary.totalExpenses.toLocaleString()}`} />
                        <RowItem label="Net Profit" value={`$${data.summary.netProfit.toLocaleString()}`} highlight />
                        <RowItem label="Profit Margin" value={`${data.summary.profitMargin.toFixed(1)}%`} />
                      </>
                    )}
                    {type === 'sales' && data.tableData?.map((row: any, i: number) => (
                      <RowItem key={i} label={row.name} value={`$${row.totalAmount.toLocaleString()}`} />
                    ))}
                    {type === 'expenses' && data.tableData?.map((row: any, i: number) => (
                      <RowItem key={i} label={row.category} value={`$${row.totalAmount.toLocaleString()}`} />
                    ))}
                    {type === 'balance-sheet' && data.accounts?.map((row: any, i: number) => (
                      <RowItem key={i} label={row.name} value={`$${row.balance.toLocaleString()}`} />
                    ))}
                    {type === 'cash-flow' && data.summary && (
                      <>
                        <RowItem label="Total Inflow" value={`$${data.summary.totalInflow.toLocaleString()}`} />
                        <RowItem label="Total Outflow" value={`$${data.summary.totalOutflow.toLocaleString()}`} />
                        <RowItem label="Net Cash Flow" value={`$${data.summary.netCashFlow.toLocaleString()}`} highlight />
                      </>
                    )}
                    {type === 'income' && data.chartData?.slice(0, 12).map((row: any, i: number) => (
                      <RowItem key={i} label={row.month} value={`$${row.total.toLocaleString()}`} />
                    ))}
                    {type === 'purchases' && data.chartData?.map((row: any, i: number) => (
                      <RowItem key={i} label={row.supplier} value={`$${row.totalAmount.toLocaleString()}`} />
                    ))}
                    {type === 'customer-statement' && data.tableData?.map((row: any, i: number) => (
                      <RowItem key={i} label={row.name} value={`$${row.balance.toLocaleString()}`} />
                    ))}
                    {type === 'supplier-statement' && data.tableData?.map((row: any, i: number) => (
                      <RowItem key={i} label={row.name} value={`$${row.balance.toLocaleString()}`} />
                    ))}
                    {type === 'inventory' && (
                      <>
                        <RowItem label="Total Products" value={data.summary.totalProducts.toString()} />
                        <RowItem label="Total Value" value={`$${data.summary.totalValue.toLocaleString()}`} highlight />
                        <RowItem label="Low Stock Items" value={data.summary.lowStockCount.toString()} />
                      </>
                    )}
                    {type === 'tax' && (
                      <>
                        <RowItem label="Tax Collected" value={`$${data.summary.totalTaxCollected.toLocaleString()}`} highlight />
                        <RowItem label="Taxable Sales" value={`$${data.summary.totalTaxableSales.toLocaleString()}`} />
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function CardSummary({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h3 className={`text-2xl font-bold mt-2 ${color || ''}`}>{value}</h3>
      </CardContent>
    </Card>
  );
}

function RowItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <TableRow>
      <TableCell className={`font-medium ${highlight ? 'text-primary' : ''}`}>{label}</TableCell>
      <TableCell className={`text-right ${highlight ? 'font-bold text-primary' : ''}`}>{value}</TableCell>
    </TableRow>
  );
}