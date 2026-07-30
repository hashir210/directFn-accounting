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
  Send,
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

interface SupplierReturn {
  id: string;
  returnNo: string;
  supplier: { name: string };
  purchaseOrder?: { orderNo: string };
  totalAmount: number;
  status: string;
  reason: string | null;
  createdAt: string;
}

export default function SupplierReturnsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('purchases.edit');

  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [reason, setReason] = useState('');
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Item selector helpers
  const [currProductId, setCurrProductId] = useState('');
  const [currQty, setCurrQty] = useState(1);

  const fetchReturns = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/supplier-returns?page=${page}`);
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

  const fetchMetadata = async () => {
    try {
      const supRes = await apiFetch('/api/v1/suppliers');
      setSuppliers(supRes.items || []);
      const prodRes = await apiFetch('/api/v1/products');
      setProducts(prodRes.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchMetadata();
  }, [fetchReturns]);

  const handleAddItem = () => {
    if (!currProductId) return;
    const prod = products.find(p => p.id === currProductId);
    if (!prod) return;

    const price = Number(prod.purchasePrice);
    const lineTotal = currQty * price;

    const newItem = {
      productId: currProductId,
      productName: prod.name,
      quantity: currQty,
      unitPrice: price,
      lineTotal,
    };

    setReturnItems([...returnItems, newItem]);
    setCurrProductId('');
    setCurrQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || returnItems.length === 0) {
      setError('Please select a supplier and add at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiFetch('/api/v1/supplier-returns', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          reason,
          items: returnItems,
        }),
      });
      setOpenAdd(false);
      setSelectedSupplierId('');
      setReason('');
      setReturnItems([]);
      fetchReturns();
    } catch (err: any) {
      setError(err.message || 'Failed to create return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessReturn = async (id: string, action: 'ship' | 'complete' | 'reject') => {
    try {
      await apiFetch(`/api/v1/supplier-returns/${id}/process`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      fetchReturns();
    } catch (err) {
      console.error(err);
    }
  };

  const totalCalc = returnItems.reduce((acc, i) => acc + i.lineTotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
            Supplier Returns
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage, ship, and settle returns back to suppliers.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> Log Supplier Return
          </Button>
        )}
      </div>

      <Card className="border border-muted/40 shadow-sm bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Logged Supplier Returns</CardTitle>
          <CardDescription>View status of returned inventory to vendors.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No supplier returns logged.</div>
          ) : (<>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Cost Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{r.returnNo}</TableCell>
                    <TableCell>{r.supplier?.name}</TableCell>
                    <TableCell>Rs. {Number(r.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'Completed' ? 'secondary' :
                          r.status === 'Shipped' ? 'default' : 'outline'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === 'Pending' && canEdit && (
                        <>
                          <Button size="xs" variant="outline" onClick={() => handleProcessReturn(r.id, 'ship')}>
                            <Send className="h-3 w-3 mr-1" /> Ship
                          </Button>
                          <Button size="xs" variant="outline" className="text-destructive" onClick={() => handleProcessReturn(r.id, 'reject')}>
                            <XCircle className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                      {r.status === 'Shipped' && canEdit && (
                        <Button size="xs" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleProcessReturn(r.id, 'complete')}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Settle/Complete
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
          </>)}
        </CardContent>
      </Card>

      {/* Add Return Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-xl bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Log Return to Supplier</DialogTitle>
            <DialogDescription>Draft returned units for vendor credit settlement.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateReturn} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }

            <div className="space-y-1">
              <Label htmlFor="sup-select">Supplier *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger id="sup-select" className="w-full">
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Line Item addition */}
            <div className="border p-3 rounded-lg bg-muted/20 space-y-2">
              <Label>Add Product Items</Label>
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Select value={currProductId} onValueChange={setCurrProductId}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (Cost: Rs. {Number(p.purchasePrice).toFixed(2)})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={currQty}
                    onChange={(e) => setCurrQty(parseInt(e.target.value) || 1)}
                    className="h-8 text-xs"
                    min={1}
                  />
                </div>
                <Button type="button" size="sm" onClick={handleAddItem} className="h-8">Add</Button>
              </div>
            </div>

            {/* Added Items table */}
            {returnItems.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="py-2 text-[11px]">Product</TableHead>
                      <TableHead className="py-2 text-[11px]">Qty</TableHead>
                      <TableHead className="py-2 text-[11px]">Cost</TableHead>
                      <TableHead className="py-2 text-[11px]">Total</TableHead>
                      <TableHead className="py-2 text-right text-[11px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2 text-xs">{item.productName}</TableCell>
                        <TableCell className="py-2 text-xs">{item.quantity}</TableCell>
                        <TableCell className="py-2 text-xs">Rs. {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-xs">Rs. {item.lineTotal.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-right">
                          <Button size="xs" variant="ghost" onClick={() => handleRemoveItem(idx)}>✕</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="sr-reason">Reason for Return</Label>
              <Input
                id="sr-reason"
                placeholder="e.g. Defective stock, expired, wrong supply..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="text-sm font-semibold">Total Cost: <span className="text-primary">Rs. {totalCalc.toFixed(2)}</span></div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Log Return
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
