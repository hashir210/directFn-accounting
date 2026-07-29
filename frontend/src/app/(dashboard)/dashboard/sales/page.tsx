'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string | number;
}

interface SalesOrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
}

interface SalesOrder {
  id: string;
  orderNo: string;
  customerId: string;
  customer: { name: string };
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  items: SalesOrderItem[];
}

export default function SalesOrdersPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('sales.edit');

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Item selector helpers
  const [currProductId, setCurrProductId] = useState('');
  const [currQty, setCurrQty] = useState(1);
  const [currDiscount, setCurrDiscount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/sales-orders?search=${search}&status=${statusFilter}`);
      setOrders(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  const fetchMetadata = async () => {
    try {
      const custRes = await apiFetch('/api/v1/customers');
      setCustomers(custRes.items || []);
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

    const price = Number(prod.sellingPrice);
    const taxRate = 0; // Defaulting to 0 for simplicity
    const baseTotal = currQty * price - currDiscount;
    const lineTotal = baseTotal + baseTotal * (taxRate / 100);

    const newItem: SalesOrderItem = {
      productId: currProductId,
      productName: prod.name,
      quantity: currQty,
      unitPrice: price,
      discount: currDiscount,
      taxRate,
      lineTotal,
    };

    setOrderItems([...orderItems, newItem]);
    setCurrProductId('');
    setCurrQty(1);
    setCurrDiscount(0);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || orderItems.length === 0) {
      setError('Please select a customer and add at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiFetch('/api/v1/sales-orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: orderItems,
          couponCode: couponCode || undefined,
          notes: notes || undefined,
        }),
      });
      setOpenAdd(false);
      setSelectedCustomerId('');
      setOrderItems([]);
      setNotes('');
      setCouponCode('');
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to create sales order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async (id: string) => {
    try {
      await apiFetch(`/api/v1/sales-orders/${id}/confirm`, { method: 'POST' });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateInvoice = async (id: string) => {
    try {
      await apiFetch(`/api/v1/sales-orders/${id}/invoice`, { method: 'POST', body: JSON.stringify({ dueDate: new Date(Date.now() + 14 * 86400000).toISOString() }) });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft order?')) return;
    try {
      await apiFetch(`/api/v1/sales-orders/${id}`, { method: 'DELETE' });
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
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
            Sales Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track your customer sales orders.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> New Sales Order
          </Button>
        )}
      </div>

      <Card className="border border-muted/40 shadow-sm bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Orders</CardTitle>
          <CardDescription>Filtered list of sales orders within your organization.</CardDescription>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Draft', 'Confirmed', 'Invoiced', 'Completed', 'Cancelled'].map((status) => (
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
                  <TableHead>Order No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-bold">{o.orderNo}</TableCell>
                    <TableCell>{o.customer?.name}</TableCell>
                    <TableCell>${Number(o.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === 'Completed' || o.status === 'Invoiced' ? 'secondary' :
                          o.status === 'Confirmed' ? 'default' : 'outline'
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {o.status === 'Draft' && (
                        <>
                          <Button size="xs" variant="outline" onClick={() => handleConfirmOrder(o.id)}>Confirm</Button>
                          <Button size="xs" variant="destructive" onClick={() => handleDeleteOrder(o.id)}><Trash2 className="h-3 w-3" /></Button>
                        </>
                      )}
                      {o.status === 'Confirmed' && (
                        <Button size="xs" onClick={() => handleGenerateInvoice(o.id)}>Invoice</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Sales Order Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-2xl bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Create Sales Order</DialogTitle>
            <DialogDescription>Draft a new sales order for a customer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="customer">Customer *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customer" className="w-full">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                <Input
                  id="coupon"
                  placeholder="e.g. WELCOME50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
            </div>

            {/* Line Item addition */}
            <div className="border p-3 rounded-lg bg-muted/20 space-y-2">
              <Label>Add Order Items</Label>
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Select value={currProductId} onValueChange={setCurrProductId}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (${Number(p.sellingPrice).toFixed(2)})</SelectItem>)}
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
                      <TableHead className="py-2 text-[11px]">Price</TableHead>
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
              <Label htmlFor="notes">Order Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="text-sm font-semibold">Total Order Amount: <span className="text-primary">${totalCalc.toFixed(2)}</span></div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Order
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
