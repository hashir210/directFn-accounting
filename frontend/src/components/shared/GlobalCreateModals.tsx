'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Controller } from 'react-hook-form';
import { Loader2, DollarSign, Calendar } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { createCustomerSchema, type CreateCustomerForm } from '@/lib/schemas/customer';
import { createSupplierSchema, type CreateSupplierForm } from '@/lib/schemas/supplier';
import { createProductSchema, type CreateProductForm } from '@/lib/schemas/product';
import { createCouponSchema, type CreateCouponForm } from '@/lib/schemas/coupon';
import { createDiscountSchema, type CreateDiscountForm } from '@/lib/schemas/discount';

export function GlobalCreateModals() {
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [isCustOpen, setIsCustOpen] = useState(false);
  const [isSupOpen, setIsSupOpen] = useState(false);
  const [isProdOpen, setIsProdOpen] = useState(false);
  const [isInvOpen, setIsInvOpen] = useState(false);
  const [isWhOpen, setIsWhOpen] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  useEffect(() => {
    const onTx = () => setIsTxOpen(true);
    const onCust = () => setIsCustOpen(true);
    const onSup = () => setIsSupOpen(true);
    const onProd = () => setIsProdOpen(true);
    const onInv = () => setIsInvOpen(true);
    const onWh = () => setIsWhOpen(true);
    const onCoupon = () => setIsCouponOpen(true);
    const onDiscount = () => setIsDiscountOpen(true);

    window.addEventListener('open-transaction-modal', onTx);
    window.addEventListener('open-customer-modal', onCust);
    window.addEventListener('open-supplier-modal', onSup);
    window.addEventListener('open-product-modal', onProd);
    window.addEventListener('open-inventory-modal', onInv);
    window.addEventListener('open-warehouse-modal', onWh);
    window.addEventListener('open-coupon-modal', onCoupon);
    window.addEventListener('open-discount-modal', onDiscount);

    return () => {
      window.removeEventListener('open-transaction-modal', onTx);
      window.removeEventListener('open-customer-modal', onCust);
      window.removeEventListener('open-supplier-modal', onSup);
      window.removeEventListener('open-product-modal', onProd);
      window.removeEventListener('open-inventory-modal', onInv);
      window.removeEventListener('open-warehouse-modal', onWh);
      window.removeEventListener('open-coupon-modal', onCoupon);
      window.removeEventListener('open-discount-modal', onDiscount);
    };
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Transaction Form
  const [txType, setTxType] = useState<'Invoice' | 'Expense'>('Invoice');
  const txForm = useForm({ defaultValues: { customerName: '', amount: '', dueDate: new Date().toISOString().split('T')[0] } });

  const handleTxSubmit = async (data: { customerName: string; amount: string; dueDate: string }) => {
    setIsSubmitting(true);
    setError('');
    try {
      const endpoint = txType === 'Invoice' ? '/api/v1/invoices' : '/api/v1/expenses';
      const payload = txType === 'Invoice'
        ? { 
            customerName: data.customerName, 
            dueAt: new Date(data.dueDate).toISOString(), 
            status: 'pending',
            items: [
              {
                description: 'General Transaction',
                quantity: 1,
                unitPrice: parseFloat(data.amount) || 0
              }
            ]
          }
        : { category: 'Miscellaneous', amount: parseFloat(data.amount) || 0, vendor: data.customerName, date: new Date(data.dueDate).toISOString(), status: 'pending' };

      await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      setIsTxOpen(false);
      txForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-transactions'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Customer Form
  const custForm = useForm<CreateCustomerForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCustomerSchema) as any,
    defaultValues: { name: '', email: '', phone: '', address: '', creditLimit: undefined, status: 'Active' },
  });

  const handleCustSubmit = async (data: CreateCustomerForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          creditLimit: data.creditLimit ? Number(data.creditLimit) : undefined,
        }),
      });
      setIsCustOpen(false);
      custForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-customers'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Supplier Form
  const supForm = useForm<CreateSupplierForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSupplierSchema) as any,
    defaultValues: { name: '', category: '', contactEmail: '', phone: '', paymentTerms: 'Net 30', dueAmount: undefined },
  });

  const handleSupSubmit = async (data: CreateSupplierForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          category: data.category || undefined,
          contactEmail: data.contactEmail || undefined,
          phone: data.phone || undefined,
          paymentTerms: data.paymentTerms,
        }),
      });
      setIsSupOpen(false);
      supForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-suppliers'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Product Form
  const prodForm = useForm<CreateProductForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: { name: '', sku: '', barcode: '', category: 'Hardware', unit: 'Unit', purchasePrice: undefined, sellingPrice: undefined, stockQuantity: undefined, lowStockThreshold: undefined, taxRate: undefined },
  });

  const handleProdSubmit = async (data: CreateProductForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          sku: data.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: data.barcode || undefined,
          category: data.category || undefined,
          unit: data.unit,
          purchasePrice: Number(data.purchasePrice) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          stockQuantity: Number(data.stockQuantity) || 0,
        }),
      });
      setIsProdOpen(false);
      prodForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-products'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Inventory Form
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; code: string | null }[]>([]);
  const invForm = useForm({ defaultValues: { type: 'Stock In' as const, sku: '', itemName: '', quantity: 1, warehouse: 'Main HQ Warehouse' } });

  useEffect(() => {
    if (isInvOpen && warehouses.length === 0) {
      apiFetch<{ id: string; name: string; code: string | null }[]>('/api/v1/inventory/warehouses')
        .then(res => setWarehouses(res))
        .catch(err => console.error(err));
    }
  }, [isInvOpen, warehouses.length]);

  const handleInvSubmit = async (data: { type: string; sku: string; itemName: string; quantity: number; warehouse: string }) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/inventory', {
        method: 'POST',
        body: JSON.stringify({
          type: data.type,
          sku: data.sku || 'SKU-GENERIC',
          itemName: data.itemName || 'Stock Item',
          quantity: Number(data.quantity),
          warehouse: data.warehouse,
        }),
      });
      setIsInvOpen(false);
      invForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-inventory'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Warehouse Form
  const whForm = useForm({ defaultValues: { name: '', code: '', address: '', isDefault: false } });

  const handleWhSubmit = async (data: { name: string; code: string; address: string; isDefault: boolean }) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/inventory/warehouses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setIsWhOpen(false);
      whForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-warehouses'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Coupon Form
  const couponForm = useForm<CreateCouponForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCouponSchema) as any,
    defaultValues: { code: '', discountType: 'percentage', discountValue: 10, minOrderAmount: undefined, maxDiscount: undefined, usageLimit: undefined, isActive: true, startDate: '', endDate: '' },
  });

  const handleCouponSubmit = async (data: CreateCouponForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount || undefined,
          maxDiscount: data.maxDiscount || undefined,
          usageLimit: data.usageLimit || undefined,
          isActive: data.isActive ?? true,
          startDate: data.startDate,
          endDate: data.endDate,
        }),
      });
      setIsCouponOpen(false);
      couponForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-coupons'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Discount Form
  const discountForm = useForm<CreateDiscountForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createDiscountSchema) as any,
    defaultValues: { name: '', type: 'percentage', value: 10, minOrderAmount: undefined, maxDiscount: undefined, isActive: true },
  });

  const handleDiscountSubmit = async (data: CreateDiscountForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/discounts', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          value: data.value,
          minOrderAmount: data.minOrderAmount || undefined,
          maxDiscount: data.maxDiscount || undefined,
          isActive: data.isActive ?? true,
        }),
      });
      setIsDiscountOpen(false);
      discountForm.reset();
      window.dispatchEvent(new CustomEvent('refresh-discounts'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (setOpen: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => {
    setOpen(val);
    if (!val) setError('');
  };

  return (
    <>
      {/* 1. Transaction Modal */}
      <Dialog open={isTxOpen} onOpenChange={(val) => handleOpenChange(setIsTxOpen, val)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>Create a new invoice or expense entry in the ledger.</DialogDescription>
          </DialogHeader>
          <form onSubmit={txForm.handleSubmit(handleTxSubmit)} className="space-y-4">
            {error && <div className="text-sm text-destructive font-medium">{error}</div>}
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={txType === 'Invoice' ? 'default' : 'outline'} onClick={() => setTxType('Invoice')} className="cursor-pointer">
                  Invoice (Receivable)
                </Button>
                <Button type="button" variant={txType === 'Expense' ? 'default' : 'outline'} onClick={() => setTxType('Expense')} className="cursor-pointer">
                  Expense (Payable)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{txType === 'Invoice' ? 'Client Name' : 'Vendor Name'}</Label>
              <Input placeholder="e.g. Stark Industries" {...txForm.register('customerName', { required: 'Client name is required' })} className="h-10" />
              {txForm.formState.errors.customerName && <p className="text-xs text-destructive">{String(txForm.formState.errors.customerName.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" min="1" placeholder="5000" {...txForm.register('amount', { required: 'Amount is required' })} className="pl-9 h-10" />
                {txForm.formState.errors.amount && <p className="text-xs text-destructive mt-1">{String(txForm.formState.errors.amount.message)}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="date" {...txForm.register('dueDate', { required: 'Date is required' })} className="pl-9 h-10" />
                {txForm.formState.errors.dueDate && <p className="text-xs text-destructive mt-1">{String(txForm.formState.errors.dueDate.message)}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="txStatus" defaultChecked className="accent-primary cursor-pointer h-4 w-4" /> Paid
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="txStatus" className="accent-primary cursor-pointer h-4 w-4" /> Pending
                </label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" className="cursor-pointer" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Entry to Ledger'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Customer Modal */}
      <Dialog open={isCustOpen} onOpenChange={(val) => handleOpenChange(setIsCustOpen, val)}>
        <DialogContent>
          <form onSubmit={custForm.handleSubmit(handleCustSubmit)}>
            <DialogHeader>
              <DialogTitle>Add New Customer Profile</DialogTitle>
              <DialogDescription>Create a customer profile to track credit limits and invoices.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Customer / Company Name</Label>
                <Input placeholder="e.g. Apex Global" {...custForm.register('name')} />
                {custForm.formState.errors.name && <p className="text-xs text-destructive">{custForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Billing Email</Label>
                  <Input type="email" placeholder="billing@apex.com" {...custForm.register('email')} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+1 (555) 000-0000" {...custForm.register('phone')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Approved Credit Limit ($)</Label>
                <Input type="number" placeholder="10000" {...custForm.register('creditLimit')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCustOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Supplier Modal */}
      <Dialog open={isSupOpen} onOpenChange={(val) => handleOpenChange(setIsSupOpen, val)}>
        <DialogContent>
          <form onSubmit={supForm.handleSubmit(handleSupSubmit)}>
            <DialogHeader>
              <DialogTitle>Add New Supplier / Vendor</DialogTitle>
              <DialogDescription>Register a vendor to manage purchase bills and payable amounts.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input placeholder="e.g. AWS Cloud" {...supForm.register('name')} />
                {supForm.formState.errors.name && <p className="text-xs text-destructive">{supForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="e.g. Infrastructure" {...supForm.register('category')} />
                </div>
                <div className="space-y-2">
                  <Label>Billing Email</Label>
                  <Input type="email" placeholder="billing@vendor.com" {...supForm.register('contactEmail')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input placeholder="Net 30" {...supForm.register('paymentTerms')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSupOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Product Modal */}
      <Dialog open={isProdOpen} onOpenChange={(val) => handleOpenChange(setIsProdOpen, val)}>
        <DialogContent className="max-w-md">
          <form onSubmit={prodForm.handleSubmit(handleProdSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Product to Catalog</DialogTitle>
              <DialogDescription>Configure pricing, SKU, barcode, image URL, and stock levels.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input placeholder="e.g. POS Smart Terminal V2" {...prodForm.register('name')} />
                {prodForm.formState.errors.name && <p className="text-xs text-destructive">{prodForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input placeholder="FF-POS-V2" {...prodForm.register('sku')} />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input placeholder="890123456789" {...prodForm.register('barcode')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Cost ($)</Label>
                  <Input type="number" placeholder="220.00" {...prodForm.register('purchasePrice')} />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price ($)</Label>
                  <Input type="number" placeholder="349.00" {...prodForm.register('sellingPrice')} />
                  {prodForm.formState.errors.sellingPrice && <p className="text-xs text-destructive">{prodForm.formState.errors.sellingPrice.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Initial Stock Quantity</Label>
                <Input type="number" placeholder="10" {...prodForm.register('stockQuantity')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProdOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Inventory Modal */}
      <Dialog open={isInvOpen} onOpenChange={(val) => handleOpenChange(setIsInvOpen, val)}>
        <DialogContent className="max-w-md">
          <form onSubmit={invForm.handleSubmit(handleInvSubmit)}>
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
              <DialogDescription>Add stock in, stock out, transfers, or damaged stock write-offs.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select value={invForm.watch('type')} onValueChange={(val) => invForm.setValue('type', val as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stock In">Stock In (Purchase/Return)</SelectItem>
                    <SelectItem value="Stock Out">Stock Out (Sale/Dispatch)</SelectItem>
                    <SelectItem value="Transfer">Inter-Warehouse Transfer</SelectItem>
                    <SelectItem value="Damaged">Damaged / Write-Off</SelectItem>
                    <SelectItem value="Adjustment">Stock Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input placeholder="e.g. Thermal Receipt Paper" {...invForm.register('itemName', { required: 'Item name is required' })} />
                {invForm.formState.errors.itemName && <p className="text-xs text-destructive mt-1">{String(invForm.formState.errors.itemName.message)}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input placeholder="FF-TRP-80" {...invForm.register('sku', { required: 'SKU is required' })} />
                  {invForm.formState.errors.sku && <p className="text-xs text-destructive mt-1">{String(invForm.formState.errors.sku.message)}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" {...invForm.register('quantity')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Warehouse</Label>
                {warehouses.length > 0 ? (
                  <Select value={invForm.watch('warehouse')} onValueChange={(val) => invForm.setValue('warehouse', val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.name}>
                          {wh.name} {wh.code ? `(${wh.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input {...invForm.register('warehouse')} />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInvOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Warehouse Modal */}
      <Dialog open={isWhOpen} onOpenChange={(val) => handleOpenChange(setIsWhOpen, val)}>
        <DialogContent className="max-w-md">
          <form onSubmit={whForm.handleSubmit(handleWhSubmit)}>
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>Register a new warehouse to track inventory and stock movements.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Warehouse Name</Label>
                <Input placeholder="e.g. Regional Distribution Center" {...whForm.register('name', { required: 'Name is required' })} />
                {whForm.formState.errors.name && <p className="text-xs text-destructive mt-1">{String(whForm.formState.errors.name.message)}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input placeholder="e.g. RDC-01" {...whForm.register('code')} />
                </div>
                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" {...whForm.register('isDefault')} className="accent-primary h-4 w-4" />
                    Set as Default
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="e.g. 123 Warehouse St, City" {...whForm.register('address')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsWhOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save Warehouse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Coupon Modal */}
      <Dialog open={isCouponOpen} onOpenChange={(val) => handleOpenChange(setIsCouponOpen, val)}>
        <DialogContent className="max-w-md">
          <form onSubmit={couponForm.handleSubmit(handleCouponSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create Coupon Code</DialogTitle>
              <DialogDescription>Add a custom validation-based promotional code.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Promo Code *</Label>
                <Input
                  placeholder="e.g. WELCOME50"
                  {...couponForm.register('code')}
                  onChange={(e) => {
                    const upper = e.target.value.toUpperCase();
                    couponForm.setValue('code', upper, { shouldValidate: true });
                  }}
                />
                {couponForm.formState.errors.code && <p className="text-xs text-destructive">{couponForm.formState.errors.code.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Controller
                    control={couponForm.control}
                    name="discountType"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Value *</Label>
                  <Input type="number" {...couponForm.register('discountValue')} />
                  {couponForm.formState.errors.discountValue && <p className="text-xs text-destructive mt-1">{couponForm.formState.errors.discountValue.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Order ($)</Label>
                  <Input type="number" placeholder="Optional" {...couponForm.register('minOrderAmount')} />
                </div>
                <div className="space-y-2">
                  <Label>Usage Limit (count)</Label>
                  <Input type="number" placeholder="Optional" {...couponForm.register('usageLimit')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" {...couponForm.register('startDate')} />
                  {couponForm.formState.errors.startDate && <p className="text-xs text-destructive mt-1">{couponForm.formState.errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" {...couponForm.register('endDate')} />
                  {couponForm.formState.errors.endDate && <p className="text-xs text-destructive mt-1">{couponForm.formState.errors.endDate.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Controller
                  control={couponForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Coupon Active status</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCouponOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Create Coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 8. Discount Modal */}
      <Dialog open={isDiscountOpen} onOpenChange={(val) => handleOpenChange(setIsDiscountOpen, val)}>
        <DialogContent className="max-w-md">
          <form onSubmit={discountForm.handleSubmit(handleDiscountSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Discount Rule</DialogTitle>
              <DialogDescription>Create a new org-wide campaign discount.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input placeholder="e.g. Summer Special 10%" {...discountForm.register('name')} />
                {discountForm.formState.errors.name && <p className="text-xs text-destructive mt-1">{discountForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Controller
                    control={discountForm.control}
                    name="type"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Value *</Label>
                  <Input type="number" {...discountForm.register('value')} />
                  {discountForm.formState.errors.value && <p className="text-xs text-destructive mt-1">{discountForm.formState.errors.value.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Order ($)</Label>
                  <Input type="number" placeholder="Optional" {...discountForm.register('minOrderAmount')} />
                </div>
                <div className="space-y-2">
                  <Label>Max Cap Amount ($)</Label>
                  <Input type="number" placeholder="Optional" {...discountForm.register('maxDiscount')} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Controller
                  control={discountForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Campaign Active status</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDiscountOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Create Discount
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}