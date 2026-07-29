'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Truck,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller } from 'react-hook-form';
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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPurchaseOrderSchema, type CreatePurchaseOrderForm } from '@/lib/schemas/purchase-order';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  purchasePrice: string | number;
}

interface PurchaseOrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId: string;
  supplier: { name: string };
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  notes: string | null;
  expectedDate: string | null;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export default function PurchaseOrdersPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('purchases.edit');

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<CreatePurchaseOrderForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPurchaseOrderSchema) as any,
    defaultValues: { supplierId: '', expectedDate: '', notes: '', items: [] },
  });

  // Line item builder state (not part of the form directly)
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [currProductId, setCurrProductId] = useState('');
  const [currQty, setCurrQty] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/purchase-orders?search=${search}&status=${statusFilter}`);
      setOrders(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

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
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleAddItem = () => {
    if (!currProductId) return;
    const prod = products.find(p => p.id === currProductId);
    if (!prod) return;

    const price = Number(prod.purchasePrice);
    const taxRate = 0;
    const lineTotal = currQty * price;

    const newItem: PurchaseOrderItem = {
      productId: currProductId,
      productName: prod.name,
      quantity: currQty,
      unitPrice: price,
      taxRate,
      lineTotal,
    };

    setOrderItems([...orderItems, newItem]);
    setCurrProductId('');
    setCurrQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (data: CreatePurchaseOrderForm) => {
    if (orderItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setError('');
      await apiFetch('/api/v1/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: data.supplierId,
          items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, taxRate: i.taxRate })),
          expectedDate: data.expectedDate || undefined,
          notes: data.notes || undefined,
        }),
      });
      setOpenAdd(false);
      form.reset();
      setOrderItems([]);
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase order');
    }
  };

  const handleSendOrder = async (id: string) => {
    try {
      await apiFetch(`/api/v1/purchase-orders/${id}/send`, { method: 'POST' });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PO draft?')) return;
    try {
      await apiFetch(`/api/v1/purchase-orders/${id}`, { method: 'DELETE' });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const totalCalc = orderItems.reduce((acc, i) => acc + i.lineTotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">
            Purchase Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Draft and coordinate stock acquisition from suppliers.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> New Purchase Order
          </Button>
        )}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Acquisitions</CardTitle>
          <CardDescription>View status of outstanding and completed purchase orders.</CardDescription>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PO number or supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Draft', 'Sent', 'Partially Received', 'Received', 'Cancelled'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No orders found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-bold">{o.orderNo}</TableCell>
                    <TableCell>{o.supplier?.name}</TableCell>
                    <TableCell>${Number(o.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === 'Received' ? 'secondary' :
                          o.status === 'Sent' ? 'default' : 'outline'
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {o.status === 'Draft' && (
                        <>
                          <Button size="xs" variant="outline" onClick={() => handleSendOrder(o.id)}>Send to Supplier</Button>
                          <Button size="xs" variant="destructive" onClick={() => handleDeleteOrder(o.id)}><Trash2 className="h-3 w-3" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Purchase Order Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-2xl bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Draft a stock order to send to a supplier.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateOrder)} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="supplier">Supplier *</Label>
                <Controller
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="supplier" className="w-full">
                        <SelectValue placeholder="Select Supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.supplierId && <p className="text-xs text-destructive">{form.formState.errors.supplierId.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="exp-date">Expected Delivery Date</Label>
                <Input id="exp-date" type="date" {...form.register('expectedDate')} />
              </div>
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
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (Cost: ${Number(p.purchasePrice).toFixed(2)})</SelectItem>)}
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
            {orderItems.length > 0 && (
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
                    {orderItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2 text-xs">{item.productName}</TableCell>
                        <TableCell className="py-2 text-xs">{item.quantity}</TableCell>
                        <TableCell className="py-2 text-xs">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-xs">${item.lineTotal.toFixed(2)}</TableCell>
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
              <Label htmlFor="po-notes">Purchase Notes</Label>
              <Input id="po-notes" placeholder="Instructions or comments for supplier..." {...form.register('notes')} />
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="text-sm font-semibold">Total Order Cost: <span className="text-primary">${totalCalc.toFixed(2)}</span></div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Draft PO
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}