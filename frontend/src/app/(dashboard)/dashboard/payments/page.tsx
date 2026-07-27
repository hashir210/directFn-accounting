'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Loader2,
  Plus,
} from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface PaymentTransaction {
  id: string;
  amount: number;
  method: string;
  type: string;
  status: 'Completed' | 'Pending' | 'Failed';
  referenceType?: string;
  referenceId?: string;
  bankAccountId?: string;
  notes?: string;
  createdAt: string;
  invoice?: { id: string; invoiceNo: string; customer: { name: string } };
  purchaseBill?: { id: string; billNo: string; supplier: { name: string } };
}

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  balance: number;
}

export default function PaymentsPage() {
  const { hasPermission } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    method: 'Bank',
    type: 'Inbound',
    status: 'Completed',
    bankAccountId: 'none',
    notes: '',
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<{ data: PaymentTransaction[] }>('/api/v1/payments');
      setPayments(result.data || []);
      const banks = await apiFetch<{ data: BankAccount[] }>('/api/v1/bank-accounts');
      setBankAccounts(banks.data || []);
    } catch (err) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await apiFetch('/api/v1/payments', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          method: formData.method,
          type: formData.type,
          status: formData.status,
          bankAccountId: formData.bankAccountId === 'none' ? undefined : formData.bankAccountId,
          notes: formData.notes,
        }),
      });
      setIsAddModalOpen(false);
      setFormData({ amount: '', method: 'Bank', type: 'Inbound', status: 'Completed', bankAccountId: 'none', notes: '' });
      fetchPayments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;
    const headers = ['Transaction ID', 'Method', 'Type', 'Status', 'Reference', 'Amount', 'Date'];
    const rows = filteredPayments.map((p) => [
      p.id,
      p.method,
      p.type,
      p.status,
      p.invoice?.invoiceNo || p.purchaseBill?.billNo || '',
      p.amount.toString(),
      p.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.invoice?.invoiceNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.invoice?.customer?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.method.toLowerCase() === methodFilter.toLowerCase();
    return matchesSearch && matchesMethod;
  });

  const inboundPayments = payments.filter(p => p.type === 'Inbound' && p.status === 'Completed');
  const outboundPayments = payments.filter(p => p.type === 'Outbound' && p.status === 'Completed');
  const totalInbound = inboundPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalOutbound = outboundPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const netSettlement = totalInbound - totalOutbound;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments & Settlements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor incoming and outgoing payments, bank settlements, and transaction history.
          </p>
        </div>
        {hasPermission('payments.create') && (
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto h-9 cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Inbound Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInbound.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-emerald-600 mt-1">{inboundPayments.length} completed transactions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Outbound Volume</CardTitle>
            <CreditCard className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">${totalOutbound.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-rose-600/80 mt-1">{outboundPayments.length} completed transactions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Net Settlement</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${netSettlement.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Total cash flow</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Transactions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tx # or customer/supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium overflow-x-auto">
                {['all', 'bank', 'cash', 'card', 'online'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      methodFilter === m ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <Button variant="outline" size="sm" className="cursor-pointer text-xs h-9" onClick={handleExportCSV}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No payment transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {p.id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium">{p.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.type === 'Inbound' ? 'secondary' : 'outline'} className={`text-[10px] font-medium ${p.type === 'Inbound' ? 'bg-emerald-50 text-emerald-700' : 'text-rose-600'}`}>
                          {p.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {p.referenceType === 'Invoice' ? (
                          <div className="flex flex-col">
                            <span>{p.invoice?.customer?.name}</span>
                            <span className="text-muted-foreground text-[10px]">{p.invoice?.invoiceNo}</span>
                          </div>
                        ) : p.referenceType === 'PurchaseBill' ? (
                          <div className="flex flex-col">
                            <span>{p.purchaseBill?.supplier?.name}</span>
                            <span className="text-muted-foreground text-[10px]">{p.purchaseBill?.billNo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className={`font-bold text-xs ${p.type === 'Inbound' ? 'text-emerald-600' : 'text-foreground'}`}>
                        {p.type === 'Inbound' ? '+' : '-'}${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === 'Completed' ? 'secondary' : p.status === 'Pending' ? 'outline' : 'destructive'}
                          className={`text-[10px] capitalize ${p.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}`}
                        >
                          {p.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                          {p.status === 'Pending' && <Clock className="h-3 w-3 mr-1 inline" />}
                          {p.status === 'Failed' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inbound">Inbound (Receive)</SelectItem>
                    <SelectItem value="Outbound">Outbound (Send)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select value={formData.method} onValueChange={(val) => setFormData({ ...formData, method: val })}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Credit Card</SelectItem>
                    <SelectItem value="Online">Online / Gateway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account (Optional)</Label>
              <Select value={formData.bankAccountId} onValueChange={(val) => setFormData({ ...formData, bankAccountId: val })}>
                <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Do not link --</SelectItem>
                  {bankAccounts.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.bankName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">If linked, the bank balance will be updated automatically.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Reference</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
