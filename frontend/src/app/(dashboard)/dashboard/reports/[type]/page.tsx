'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import apiFetch from '@/lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportViewerPage() {
  const router = useRouter();
  const params = useParams();
  const type = params?.type as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const titles: Record<string, string> = {
    'profit-loss': 'Profit & Loss',
    'sales': 'Sales Report',
    'expenses': 'Expense Report'
  };

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (startDate) query.set('startDate', startDate);
        if (endDate) query.set('endDate', endDate);
        
        const res = await apiFetch(`/api/v1/reports/${type}?${query.toString()}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load report', err);
      } finally {
        setLoading(false);
      }
    };
    if (type) fetchReport();
  }, [type, startDate, endDate]);

  const handleExportCSV = () => {
    if (!data?.tableData && type !== 'profit-loss') return;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (type === 'profit-loss') {
      csvContent += 'Metric,Value\n';
      csvContent += `Total Revenue,${data.summary.totalRevenue}\n`;
      csvContent += `Total Expenses,${data.summary.totalExpenses}\n`;
      csvContent += `Net Profit,${data.summary.netProfit}\n`;
      csvContent += `Profit Margin,${data.summary.profitMargin}%\n`;
    } else if (type === 'sales') {
      csvContent += 'Customer,Total Sales\n';
      data.tableData.forEach((row: any) => {
        csvContent += `"${row.name}",${row.totalAmount}\n`;
      });
    } else if (type === 'expenses') {
      csvContent += 'Category,Total Amount\n';
      data.tableData.forEach((row: any) => {
        csvContent += `"${row.category}",${row.totalAmount}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
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
          <div className="flex items-center space-x-2 bg-card p-1 rounded-md border border-border/50">
            <Input type="date" className="h-9 border-none bg-transparent" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-muted-foreground">-</span>
            <Input type="date" className="h-9 border-none bg-transparent" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {type === 'profit-loss' && (
              <>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Total Revenue</p><h3 className="text-2xl font-bold mt-2">${data.summary.totalRevenue.toLocaleString()}</h3></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Total Expenses</p><h3 className="text-2xl font-bold mt-2">${data.summary.totalExpenses.toLocaleString()}</h3></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Net Profit</p><h3 className={`text-2xl font-bold mt-2 ${data.summary.netProfit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>${data.summary.netProfit.toLocaleString()}</h3></CardContent></Card>
              </>
            )}
            {type === 'sales' && (
              <>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Total Sales</p><h3 className="text-2xl font-bold mt-2">${data.summary.totalSales.toLocaleString()}</h3></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Total Customers</p><h3 className="text-2xl font-bold mt-2">{data.summary.totalCustomers}</h3></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Invoices Generated</p><h3 className="text-2xl font-bold mt-2">{data.summary.totalInvoices}</h3></CardContent></Card>
              </>
            )}
            {type === 'expenses' && (
              <>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Total Expenses</p><h3 className="text-2xl font-bold mt-2">${data.summary.totalExpenses.toLocaleString()}</h3></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Categories</p><h3 className="text-2xl font-bold mt-2">{data.summary.totalCategories}</h3></CardContent></Card>
                <Card><CardContent className="p-6"><p className="text-sm font-medium text-muted-foreground">Transactions</p><h3 className="text-2xl font-bold mt-2">{data.summary.totalTransactions}</h3></CardContent></Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Chart */}
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {type === 'profit-loss' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'sales' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} tickLine={false} width={100} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="sales" name="Sales Volume" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {type === 'expenses' && data.chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                          {data.chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="lg:col-span-1 shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Data Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{type === 'profit-loss' ? 'Metric' : type === 'sales' ? 'Customer' : 'Category'}</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {type === 'profit-loss' ? (
                      <>
                        <TableRow><TableCell className="font-medium">Total Revenue</TableCell><TableCell className="text-right">${data.summary.totalRevenue.toLocaleString()}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium">Total Expenses</TableCell><TableCell className="text-right">${data.summary.totalExpenses.toLocaleString()}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium text-primary">Net Profit</TableCell><TableCell className="text-right font-bold text-primary">${data.summary.netProfit.toLocaleString()}</TableCell></TableRow>
                        <TableRow><TableCell className="font-medium text-muted-foreground">Profit Margin</TableCell><TableCell className="text-right text-muted-foreground">{data.summary.profitMargin.toFixed(1)}%</TableCell></TableRow>
                      </>
                    ) : (
                      data.tableData?.map((row: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.name || row.category}</TableCell>
                          <TableCell className="text-right">${row.totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
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
