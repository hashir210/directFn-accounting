'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Building2,
  PieChart,
  Receipt,
  FileCheck,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import apiFetch from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface ExpenseItem {
  id: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

const CATEGORIES = ['all', 'salaries', 'rent', 'software', 'utilities', 'supplies'] as const;

export default function ExpensesPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('expenses.edit');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('Software');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search) params.set('search', search);
      const result = await apiFetch<{ data: ExpenseItem[] }>(`/api/v1/expenses?${params.toString()}`);
      setExpenses(result.data);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totalMonthlyOutflow = expenses.reduce((acc, e) => acc + e.amount, 0);
  const approvedExpenses = expenses.filter((e) => e.status === 'approved').reduce((acc, e) => acc + e.amount, 0);
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !amount) return;
    setCreating(true);
    try {
      await apiFetch('/api/v1/expenses', {
        method: 'POST',
        body: JSON.stringify({
          vendor,
          category,
          description: description || undefined,
          amount: parseFloat(amount),
          date: date || undefined,
        }),
      });
      setVendor('');
      setDescription('');
      setAmount('');
      setDate('');
      setDialogOpen(false);
      fetchExpenses();
    } finally {
      setCreating(false);
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Vendor', 'Category', 'Description', 'Amount', 'Date', 'Status'];
    const rows = expenses.map((exp) => [
      `"${exp.vendor.replace(/"/g, '""')}"`,
      `"${exp.category.replace(/"/g, '""')}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      exp.amount,
      exp.date,
      exp.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expenses_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record, organize, and monitor operational expenses and vendor payments.
          </p>
        </div>

        {canEdit && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Record Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleRecordExpense}>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
                <DialogDescription>Enter vendor billing and categorization information.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor / Recipient</Label>
                  <Input
                    id="vendor"
                    required
                    placeholder="AWS / Slack / Landlord"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full h-9 px-3 py-1 bg-background border rounded-md text-xs font-medium focus:ring-2 focus:ring-primary cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Software">Software & IT</option>
                      <option value="Salaries">Payroll & Salaries</option>
                      <option value="Rent">Office Rent</option>
                      <option value="Utilities">Utilities & HVAC</option>
                      <option value="Supplies">Office Supplies</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      required
                      placeholder="1200.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Monthly cloud hosting fee"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Expense Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer" disabled={creating}>
                  {creating ? 'Saving...' : 'Save Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Outflow</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlyOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">This billing cycle</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Top Category</CardTitle>
            <PieChart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">{topCategory?.[0] || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topCategory ? `${((topCategory[1] / totalMonthlyOutflow) * 100).toFixed(1)}% of total expenses` : 'No expenses'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Approved Outflow</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${approvedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Verified & processed</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Records</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expenses.length}</div>
            <p className="text-xs text-amber-600/80 mt-1">Expense entries</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendor or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                      categoryFilter === cat ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <Button onClick={handleExportCSV} variant="outline" size="sm" className="cursor-pointer text-xs h-9">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor / Recipient</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No expense records found
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow key={exp.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-xs flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      {exp.vendor}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exp.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exp.date}</TableCell>
                    <TableCell className="font-bold text-xs">
                      ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={exp.status === 'approved' ? 'default' : 'outline'}
                        className={`text-[10px] capitalize ${
                          exp.status === 'approved' ? 'bg-emerald-600' : 'text-amber-600 border-amber-300'
                        }`}
                      >
                        {exp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
