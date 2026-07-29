'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

interface PurchaseInvoice {
  id: string;
  billNo: string;
  supplierId: string;
  supplier: { name: string };
  purchaseOrder?: { orderNo: string };
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export default function PurchaseInvoicesPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('purchases.edit');

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Payment State
  const [openPay, setOpenPay] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/purchase-orders/invoices?status=all`);
      setInvoices(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPOs = async () => {
    try {
      // Sent/Received POs that don't have bills yet or are fully received
      const res = await apiFetch('/api/v1/purchase-orders');
      setPurchaseOrders(res.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPOs();
  }, [fetchInvoices]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !dueDate) {
      setError('Please select a purchase order and due date');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiFetch(`/api/v1/purchase-orders/${selectedPoId}/invoice`, {
        method: 'POST',
        body: JSON.stringify({ dueDate }),
      });
      setOpenAdd(false);
      setSelectedPoId('');
      setDueDate('');
      fetchInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    try {
      setIsSubmitting(true);
      setError('');
      // Record payment endpoint in suppliers module
      await apiFetch(`/api/v1/suppliers/payments`, {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedInvoice.supplierId || '', // supplier ref
          amount: parseFloat(paymentAmount),
          note: paymentNote,
        }),
      });
      setOpenPay(false);
      setPaymentAmount('');
      setPaymentNote('');
      fetchInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to record supplier payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
            Purchase Invoices (Bills)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage vendor invoices, bills, and payments.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> Log Purchase Bill
          </Button>
        )}
      </div>

      <Card className="border border-muted/40 shadow-sm bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Outstanding Bills</CardTitle>
          <CardDescription>View, track, and pay incoming vendor invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No purchase bills found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>PO Ref</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-bold">{inv.billNo}</TableCell>
                    <TableCell>{inv.supplier?.name}</TableCell>
                    <TableCell>{inv.purchaseOrder?.orderNo || 'Direct'}</TableCell>
                    <TableCell>${inv.amount.toFixed(2)}</TableCell>
                    <TableCell>${inv.paidAmount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'Paid' ? 'secondary' : 'outline'}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status !== 'Paid' && canEdit && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setOpenPay(true);
                          }}
                        >
                          <DollarSign className="h-3 w-3 mr-1" /> Record Payment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Bill Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-md bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Log Purchase Bill</DialogTitle>
            <DialogDescription>Generate a purchase invoice/bill from a Purchase Order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }

            <div className="space-y-1">
              <Label htmlFor="po-bill-select">Purchase Order Reference *</Label>
              <Select value={selectedPoId} onValueChange={setSelectedPoId}>
                <SelectTrigger id="po-bill-select" className="w-full">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders
                    .filter((po) => ['Sent', 'Partially Received', 'Received'].includes(po.status))
                    .map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.orderNo} - {po.supplier?.name} (${Number(po.totalAmount).toFixed(2)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bill-due">Due Date *</Label>
              <Input
                id="bill-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Bill
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Bill Dialog */}
      <Dialog open={openPay} onOpenChange={setOpenPay}>
        <DialogContent className="max-w-md bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Record Supplier Payment</DialogTitle>
            <DialogDescription>Document transaction check or wire transfers paid to supplier.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }

            <div className="space-y-1">
              <Label htmlFor="pay-amt">Payment Amount ($) *</Label>
              <Input
                id="pay-amt"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Max: $${selectedInvoice ? (selectedInvoice.amount - selectedInvoice.paidAmount).toFixed(2) : '0.00'}`}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pay-note">Payment Memo / Note</Label>
              <Input
                id="pay-note"
                placeholder="e.g. Wire reference no, cheque number..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenPay(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
