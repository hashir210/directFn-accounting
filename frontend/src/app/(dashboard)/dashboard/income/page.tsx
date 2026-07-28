'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createIncomeSchema, type CreateIncomeForm } from '@/lib/schemas/income';
import { DollarSign, Download, Loader2, Plus, TrendingUp } from 'lucide-react';
import apiFetch from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Income = { id: string; category: string; description?: string | null; amount: number; date: string; referenceNo?: string | null };
const categories = ['Sales', 'Services', 'Investment', 'Other Income'];
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function IncomePage() {
  const [records, setRecords] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const incomeForm = useForm<CreateIncomeForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createIncomeSchema) as any,
    defaultValues: {
      category: 'Sales',
      description: '',
      amount: undefined,
      date: new Date().toISOString().slice(0, 10),
      referenceNo: '',
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ data: Income[] }>('/api/v1/income?limit=100');
      setRecords(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  const total = useMemo(() => records.reduce((sum, item) => sum + item.amount, 0), [records]);

  const top = useMemo(
    () =>
      Object.entries(
        records.reduce<Record<string, number>>(
          (sum, item) => ({ ...sum, [item.category]: (sum[item.category] || 0) + item.amount }),
          {},
        ),
      ).sort((a, b) => b[1] - a[1])[0],
    [records],
  );

  const create = async (data: CreateIncomeForm) => {
    setSaving(true);
    try {
      await apiFetch('/api/v1/income', {
        method: 'POST',
        body: JSON.stringify({
          category: data.category,
          description: data.description || undefined,
          amount: data.amount,
          date: data.date || undefined,
          referenceNo: data.referenceNo || undefined,
        }),
      });
      setOpen(false);
      incomeForm.reset();
      await load();
    } finally {
      setSaving(false);
    }
  };

  function exportCsv() {
    const csv = [
      ['Category', 'Description', 'Amount', 'Date', 'Reference'],
      ...records.map((r) => [r.category, r.description || '', r.amount, r.date, r.referenceNo || '']),
    ]
      .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'income.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">Record sales, services, investment, and other income.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record income
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Total income" value={money(total)} icon={DollarSign} />
        <Metric title="Records" value={String(records.length)} icon={TrendingUp} />
        <Metric title="Top source" value={top?.[0] || '\u2014'} icon={DollarSign} />
      </div>

      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle>Income records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : records.length ? (
                records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.category}</Badge>
                    </TableCell>
                    <TableCell>{r.description || '\u2014'}</TableCell>
                    <TableCell>{r.referenceNo || '\u2014'}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">{money(r.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No income has been recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={incomeForm.handleSubmit(create)}>
            <DialogHeader>
              <DialogTitle>Record income</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Label>
                Category
                <select
                  className="mt-1 h-9 w-full rounded-md border bg-background px-3"
                  {...incomeForm.register('category')}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Label>
              <Label>
                Amount
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...incomeForm.register('amount')}
                />
              </Label>
              <Label>
                Date
                <Input
                  required
                  type="date"
                  {...incomeForm.register('date')}
                />
              </Label>
              <Label>
                Reference number
                <Input {...incomeForm.register('referenceNo')} />
              </Label>
              <Label>
                Description
                <Input {...incomeForm.register('description')} />
              </Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving\u2026' : 'Save income'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs uppercase text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
