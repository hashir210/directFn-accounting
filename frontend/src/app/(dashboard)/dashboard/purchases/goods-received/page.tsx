'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useCallback } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  Loader2,
  CheckCircle,
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

interface GoodsReceived {
  id: string;
  grnNo: string;
  purchaseOrder: { orderNo: string; supplier: { name: string } };
  receivedDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function GoodsReceivedPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('purchases.edit');

  const [grns, setGrns] = useState<GoodsReceived[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [itemsToReceive, setItemsToReceive] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchGrns = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/purchase-orders/goods-received`);
      setGrns(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPOs = async () => {
    try {
      // Load Sent or Partially Received orders
      const res = await apiFetch('/api/v1/purchase-orders?status=Sent');
      setPurchaseOrders(res.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGrns();
    fetchPOs();
  }, [fetchGrns]);

  const handlePoChange = async (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) {
      setItemsToReceive([]);
      return;
    }
    try {
      const res = await apiFetch(`/api/v1/purchase-orders/${poId}`);
      const poItems = res.items || [];
      setItemsToReceive(
        poItems.map((item: any) => ({
          productId: item.productId,
          productName: item.product?.name || 'Product',
          quantity: item.quantity,
          receivedQty: item.quantity - item.receivedQty, // outstanding qty
          acceptedQty: item.quantity - item.receivedQty,
          rejectedQty: 0,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleQtyChange = (idx: number, field: string, value: number) => {
    setItemsToReceive(
      itemsToReceive.map((item, i) => {
        if (i === idx) {
          const update = { ...item, [field]: value };
          if (field === 'receivedQty') {
            update.acceptedQty = value;
          }
          return update;
        }
        return item;
      })
    );
  };

  const handleCreateGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || itemsToReceive.length === 0) {
      setError('Please select a purchase order');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiFetch(`/api/v1/purchase-orders/${selectedPoId}/receive`, {
        method: 'POST',
        body: JSON.stringify({
          items: itemsToReceive,
          notes,
        }),
      });
      setOpenAdd(false);
      setSelectedPoId('');
      setNotes('');
      setItemsToReceive([]);
      fetchGrns();
      fetchPOs();
    } catch (err: any) {
      setError(err.message || 'Failed to record GRN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">
            Goods Received Notes (GRN)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Receive inventory shipments and record stock updates.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> Receive Shipment (GRN)
          </Button>
        )}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">GRN History</CardTitle>
          <CardDescription>View all historical Goods Received Notes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : grns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No GRNs recorded.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN No</TableHead>
                  <TableHead>PO Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-bold">{g.grnNo}</TableCell>
                    <TableCell>{g.purchaseOrder?.orderNo}</TableCell>
                    <TableCell>{g.purchaseOrder?.supplier?.name}</TableCell>
                    <TableCell>{new Date(g.receivedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-max">
                        <CheckCircle className="h-3 w-3 text-emerald-500" /> {g.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Receive Shipment Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-2xl bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Receive Goods (GRN)</DialogTitle>
            <DialogDescription>Check in inventory items from supplier delivery.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGrn} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }

            <div className="space-y-1">
              <Label htmlFor="po-select">Select Outstanding Purchase Order *</Label>
              <Select value={selectedPoId} onValueChange={handlePoChange}>
                <SelectTrigger id="po-select" className="w-full">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.orderNo} - {po.supplier?.name} (${Number(po.totalAmount).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {itemsToReceive.length > 0 && (
              <div className="space-y-2">
                <Label>Inspect item quantities</Label>
                <div className="border rounded-lg overflow-hidden divide-y max-h-60 overflow-y-auto">
                  {itemsToReceive.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">PO Order Qty: {item.quantity}</div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col gap-1 items-center">
                          <Label className="text-[10px] text-muted-foreground">Received</Label>
                          <Input
                            type="number"
                            value={item.receivedQty}
                            onChange={(e) => handleQtyChange(idx, 'receivedQty', parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-xs text-center"
                            min={0}
                          />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <Label className="text-[10px] text-muted-foreground">Accepted</Label>
                          <Input
                            type="number"
                            value={item.acceptedQty}
                            onChange={(e) => handleQtyChange(idx, 'acceptedQty', parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-xs text-center"
                            min={0}
                          />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <Label className="text-[10px] text-muted-foreground">Rejected</Label>
                          <Input
                            type="number"
                            value={item.rejectedQty}
                            onChange={(e) => handleQtyChange(idx, 'rejectedQty', parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-xs text-center"
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="grn-notes">Receipt Notes</Label>
              <Input
                id="grn-notes"
                placeholder="Damage notes, shipment conditions, delivery slip no..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save GRN Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
