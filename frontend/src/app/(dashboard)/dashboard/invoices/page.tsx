'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Receipt,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  FileText,
  Loader2,
  Eye,
} from 'lucide-react';
import apiFetch from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { useRouter } from 'next/navigation';

interface UnifiedInvoice {
  id: string;
  invoiceNo: string;
  type: 'direct' | 'sales' | 'purchase';
  typeLabel: string;
  counterpartyName: string;
  counterpartyEmail: string | null;
  amount: number;
  status: string;
  issuedAt: string;
  dueAt: string;
}

export default function InvoicesPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('invoices.edit');
  const router = useRouter();
  const [invoices, setInvoices] = useState<UnifiedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (search) params.set('search', search);
      params.set('page', String(page));
      const result = await apiFetch<any>(`/api/v1/invoices/unified?${params.toString()}`);
      setInvoices(result.data || []);
      if (result.pagination) setTotalPages(result.pagination.totalPages || 1);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid' || i.status === 'Paid').reduce((acc, inv) => acc + inv.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending' || i.status === 'Unpaid').reduce((acc, inv) => acc + inv.amount, 0);

  const handleMarkPaid = async (inv: UnifiedInvoice) => {
    try {
      if (inv.type === 'sales') {
        await apiFetch(`/api/v1/sales-orders/${inv.id}/pay`, { method: 'POST' });
      } else if (inv.type === 'direct') {
        await apiFetch(`/api/v1/invoices/${inv.id}/pay`, { method: 'POST' });
      }
      fetchInvoices();
    } catch {}
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) return;
    const headers = ['Invoice No', 'Type', 'Counterparty', 'Amount', 'Status', 'Issued Date', 'Due Date'];
    const rows = invoices.map((inv) => [
      inv.invoiceNo,
      inv.typeLabel,
      `"${inv.counterpartyName.replace(/"/g, '""')}"`,
      inv.amount,
      inv.status,
      inv.issuedAt,
      inv.dueAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `all_invoices_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case 'direct': return 'default' as const;
      case 'sales': return 'secondary' as const;
      case 'purchase': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified view of all invoices — direct, sales, and purchase bills.
          </p>
        </div>

        {canEdit && (
          <Button className="cursor-pointer" onClick={() => router.push('/dashboard/invoices/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalInvoiced.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{invoices.length} records</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Collected / Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Rs. {totalPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-primary/80 mt-1">Settled</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rs. {totalPending.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice # or name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
                {(['all', 'direct', 'sales', 'purchase'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setPage(1); }}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                      typeFilter === t ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'direct' ? 'Direct' : t === 'sales' ? 'Sales' : t === 'purchase' ? 'Purchase' : 'All'}
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
                <TableHead>Invoice #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={`Rs. ${inv.type}-${inv.id}`} className="hover:bg-muted transition-colors">
                    <TableCell className="font-semibold text-xs flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      {inv.invoiceNo}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariant(inv.type)} className="text-[10px] capitalize">
                        {inv.typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-xs">{inv.counterpartyName}</span>
                      {inv.counterpartyEmail && (
                        <span className="text-[11px] text-muted-foreground block">{inv.counterpartyEmail}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.issuedAt}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.dueAt}</TableCell>
                    <TableCell className="font-bold text-xs">
                      Rs. {inv.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === 'paid' || inv.status === 'Paid' ? 'secondary' :
                          inv.status === 'paid' || inv.status === 'Paid' ? 'secondary' :
                          inv.status === 'pending' || inv.status === 'Unpaid' || inv.status === 'draft' ? 'outline' : 'destructive'
                        }
                        className="text-[10px] capitalize"
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(inv.status === 'Unpaid' || inv.status === 'pending') && inv.type !== 'purchase' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            onClick={() => handleMarkPaid(inv)}
                            title="Mark as paid"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t">
              <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
