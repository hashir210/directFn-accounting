'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Loader2,
  DollarSign,
  FileText,
  Eye,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface SalesInvoiceItem {
  id: string;
  invoiceNo: string;
  salesOrder: { orderNo: string; customer: { name: string } };
  totalAmount: number;
  status: string;
  dueAt: string;
  createdAt: string;
  items: any[];
}

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState<SalesInvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewInvoice, setViewInvoice] = useState<SalesInvoiceItem | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/sales-orders/invoices?page=${page}`);
      const data = res.data || res;
      setInvoices(data.items || []);
      const pag = data.pagination;
      if (pag) setTotalPages(pag.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePay = async (id: string) => {
    try {
      await apiFetch(`/api/v1/sales-orders/${id}/pay`, { method: 'POST' });
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
            Sales Invoices
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Invoices generated from confirmed sales orders.</p>
        </div>
      </div>

      <Card className="border border-muted/40 shadow-sm bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No sales invoices found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-bold text-xs">
                        <FileText className="h-3 w-3 inline mr-1 text-primary" />
                        {inv.invoiceNo}
                      </TableCell>
                      <TableCell className="text-xs">{inv.salesOrder?.orderNo}</TableCell>
                      <TableCell className="text-xs">{inv.salesOrder?.customer?.name}</TableCell>
                      <TableCell className="text-xs font-semibold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{new Date(inv.dueAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'Paid' ? 'secondary' : 'outline'} className="text-[10px]">{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="xs" variant="ghost" onClick={() => setViewInvoice(inv)}><Eye className="h-3 w-3" /></Button>
                        {inv.status === 'Unpaid' && (
                          <Button size="xs" variant="secondary" onClick={() => handlePay(inv.id)}>
                            <DollarSign className="h-3 w-3 mr-1" /> Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewInvoice(null)}>
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">{viewInvoice.invoiceNo}</h2>
                <p className="text-xs text-muted-foreground">Customer: {viewInvoice.salesOrder?.customer?.name}</p>
                <p className="text-xs text-muted-foreground">Order: {viewInvoice.salesOrder?.orderNo}</p>
              </div>
              <Badge>{viewInvoice.status}</Badge>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="py-2 text-xs">Item</TableHead>
                    <TableHead className="py-2 text-xs">Qty</TableHead>
                    <TableHead className="py-2 text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewInvoice.items?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="py-2 text-xs">{item.product?.name || 'Product'}</TableCell>
                      <TableCell className="py-2 text-xs">{item.quantity}</TableCell>
                      <TableCell className="py-2 text-xs text-right">${Number(item.lineTotal).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-right text-lg font-bold">Total: ${Number(viewInvoice.totalAmount).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Due: {new Date(viewInvoice.dueAt).toLocaleDateString()}</div>
            <Button className="w-full" variant="outline" onClick={() => setViewInvoice(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
