'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface SalesReturn {
  id: string;
  returnNo: string;
  salesInvoice: { invoiceNo: string; salesOrder?: { customer: { name: string } } };
  totalAmount: number;
  status: string;
  reason: string | null;
  createdAt: string;
}

export default function SalesReturnsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('sales.edit');

  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [reason, setReason] = useState('');
  const [itemsToReturn, setItemsToReturn] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReturns = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/sales-returns?page=${page}`);
      const data = res.data || res;
      setReturns(data.items || []);
      const pag = data.pagination;
      if (pag) setTotalPages(pag.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReturns();
    // Fetch sales invoices for selection (not legacy invoices)
    apiFetch('/api/v1/sales-orders/invoices?limit=100').then((res: any) => setInvoices(res?.items || []));
  }, [fetchReturns]);

  const handleInvoiceChange = async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    if (!invoiceId) {
      setItemsToReturn([]);
      return;
    }
    try {
      // Fetch details of specific sales invoice to get its items
      const invoiceData = invoices.find((inv: any) => inv.id === invoiceId);
      const invItems = invoiceData?.items || [];
      setItemsToReturn(invItems.map((item: any) => ({ ...item, productId: item.productId, productName: item.product?.name || 'Product', returnQty: item.quantity })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnQtyChange = (idx: number, qty: number) => {
    setItemsToReturn(
      itemsToReturn.map((item, i) => (i === idx ? { ...item, returnQty: Math.max(0, Math.min(item.quantity, qty)) } : item))
    );
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeItems = itemsToReturn.filter(i => i.returnQty > 0);
    if (!selectedInvoiceId || activeItems.length === 0) {
      setError('Please select an invoice and return at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiFetch('/api/v1/sales-returns', {
        method: 'POST',
        body: JSON.stringify({
          salesInvoiceId: selectedInvoiceId,
          reason,
          items: activeItems.map(i => ({
            productId: i.productId || i.id, // match model schema product mapping
            quantity: i.returnQty,
            unitPrice: Number(i.unitPrice),
            reason,
          })),
        }),
      });
      setOpenAdd(false);
      setSelectedInvoiceId('');
      setReason('');
      setItemsToReturn([]);
      fetchReturns();
    } catch (err: any) {
      setError(err.message || 'Failed to create sales return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessReturn = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiFetch(`/api/v1/sales-returns/${id}/process`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      fetchReturns();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
            Sales Returns
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and approve returns or credit notes.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> Log Return
          </Button>
        )}
      </div>

      <Card className="border border-muted/40 shadow-sm bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Logged Returns</CardTitle>
          <CardDescription>View, process, and approve credit returns.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No returns logged.</div>
          ) : (<>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return No</TableHead>
                  <TableHead>Invoice Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Refund</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{r.returnNo}</TableCell>
                    <TableCell>{r.salesInvoice?.invoiceNo}</TableCell>
                    <TableCell>{r.salesInvoice?.salesOrder?.customer?.name || 'Customer'}</TableCell>
                    <TableCell>Rs. {Number(r.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'Approved' ? 'secondary' :
                          r.status === 'Rejected' ? 'destructive' : 'outline'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === 'Pending' && canEdit && (
                        <>
                          <Button size="xs" variant="outline" className="text-emerald-600 hover:text-emerald-700" onClick={() => handleProcessReturn(r.id, 'approve')}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="xs" variant="outline" className="text-destructive hover:text-destructive/80" onClick={() => handleProcessReturn(r.id, 'reject')}>
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
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
          </>)}
        </CardContent>
      </Card>

      {/* Add Return Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-xl bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Create Sales Return</DialogTitle>
            <DialogDescription>Create a refund or credit note against a sales invoice.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateReturn} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }

            <div className="space-y-1">
              <Label htmlFor="invoice-select">Invoice Reference *</Label>
              <Select value={selectedInvoiceId} onValueChange={handleInvoiceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((inv: any) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNo} - {inv.salesOrder?.customer?.name || 'Customer'} - Rs. {Number(inv.totalAmount).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {itemsToReturn.length > 0 && (
              <div className="space-y-2">
                <Label>Select items & quantity to return</Label>
                <div className="border rounded-lg overflow-hidden divide-y">
                  {itemsToReturn.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">Purchased: {item.quantity} | Price: Rs. {Number(item.unitPrice).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${idx}`} className="text-xs">Return Qty</Label>
                        <Input
                          id={`qty-${idx}`}
                          type="number"
                          value={item.returnQty}
                          onChange={(e) => handleReturnQtyChange(idx, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-xs text-center"
                          min={0}
                          max={item.quantity}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="return-reason">Reason for Return</Label>
              <Input
                id="return-reason"
                placeholder="e.g. Faulty device, wrong model..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit Return
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
