'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, DollarSign, Calendar } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';

export function GlobalCreateModals() {
  // --- States for Modal Visibility ---
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [isCustOpen, setIsCustOpen] = useState(false);
  const [isSupOpen, setIsSupOpen] = useState(false);
  const [isProdOpen, setIsProdOpen] = useState(false);
  const [isInvOpen, setIsInvOpen] = useState(false);

  // --- Global Event Listeners ---
  useEffect(() => {
    const onTx = () => setIsTxOpen(true);
    const onCust = () => setIsCustOpen(true);
    const onSup = () => setIsSupOpen(true);
    const onProd = () => setIsProdOpen(true);
    const onInv = () => setIsInvOpen(true);

    window.addEventListener('open-transaction-modal', onTx);
    window.addEventListener('open-customer-modal', onCust);
    window.addEventListener('open-supplier-modal', onSup);
    window.addEventListener('open-product-modal', onProd);
    window.addEventListener('open-inventory-modal', onInv);

    return () => {
      window.removeEventListener('open-transaction-modal', onTx);
      window.removeEventListener('open-customer-modal', onCust);
      window.removeEventListener('open-supplier-modal', onSup);
      window.removeEventListener('open-product-modal', onProd);
      window.removeEventListener('open-inventory-modal', onInv);
    };
  }, []);

  // --- Shared States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Transaction Form
  const [txType, setTxType] = useState<"Invoice" | "Expense">("Invoice");
  const [txCustomerName, setTxCustomerName] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"Paid" | "Pending">("Pending");
  const [txDueDate, setTxDueDate] = useState(new Date().toISOString().split("T")[0]);

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const endpoint = txType === 'Invoice' ? '/api/v1/invoices' : '/api/v1/expenses';
      const payload = txType === 'Invoice' ? {
        customerName: txCustomerName,
        amount: parseFloat(txAmount) || 0,
        dueAt: new Date(txDueDate).toISOString(),
        status: txStatus
      } : {
        category: 'General',
        amount: parseFloat(txAmount) || 0,
        vendor: txCustomerName,
        date: new Date(txDueDate).toISOString(),
        status: txStatus
      };
      
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsTxOpen(false);
      setTxCustomerName("");
      setTxAmount("");
      window.dispatchEvent(new CustomEvent('refresh-transactions'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Customer Form
  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '', address: '', creditLimit: '10000' });
  const handleCustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: newCust.name,
          email: newCust.email || undefined,
          phone: newCust.phone || undefined,
          address: newCust.address || undefined,
          creditLimit: parseFloat(newCust.creditLimit) || 0,
        }),
      });
      setIsCustOpen(false);
      setNewCust({ name: '', email: '', phone: '', address: '', creditLimit: '10000' });
      window.dispatchEvent(new CustomEvent('refresh-customers'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Supplier Form
  const [newSup, setNewSup] = useState({ name: '', category: '', email: '', phone: '', terms: 'Net 30' });
  const handleSupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          name: newSup.name,
          category: newSup.category || undefined,
          contactEmail: newSup.email || undefined,
          phone: newSup.phone || undefined,
          paymentTerms: newSup.terms,
        }),
      });
      setIsSupOpen(false);
      setNewSup({ name: '', category: '', email: '', phone: '', terms: 'Net 30' });
      window.dispatchEvent(new CustomEvent('refresh-suppliers'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Product Form
  const [newProd, setNewProd] = useState({
    name: '', sku: '', barcode: '', category: 'Hardware', unit: 'Unit',
    purchasePrice: '0', sellingPrice: '0', imageUrl: '', stockQuantity: '10'
  });
  const handleProdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProd.name,
          sku: newProd.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: newProd.barcode || undefined,
          category: newProd.category || undefined,
          unit: newProd.unit,
          purchasePrice: parseFloat(newProd.purchasePrice) || 0,
          sellingPrice: parseFloat(newProd.sellingPrice) || 0,
          imageUrl: newProd.imageUrl || undefined,
          stockQuantity: parseInt(newProd.stockQuantity) || 0,
        }),
      });
      setIsProdOpen(false);
      setNewProd({ name: '', sku: '', barcode: '', category: 'Hardware', unit: 'Unit', purchasePrice: '0', sellingPrice: '0', imageUrl: '', stockQuantity: '10' });
      window.dispatchEvent(new CustomEvent('refresh-products'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Inventory Form
  const [warehouses, setWarehouses] = useState<{id: string; name: string; code: string | null}[]>([]);
  const [newMov, setNewMov] = useState<{
    type: 'Stock In' | 'Stock Out' | 'Transfer' | 'Damaged' | 'Adjustment';
    sku: string; itemName: string; quantity: number; warehouse: string;
  }>({
    type: 'Stock In', sku: '', itemName: '', quantity: 1, warehouse: 'Main HQ Warehouse'
  });

  useEffect(() => {
    if (isInvOpen && warehouses.length === 0) {
      apiFetch<{id: string; name: string; code: string | null}[]>('/api/v1/inventory/warehouses')
        .then(res => setWarehouses(res))
        .catch(err => console.error(err));
    }
  }, [isInvOpen, warehouses.length]);

  const handleInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/inventory', {
        method: 'POST',
        body: JSON.stringify({
          type: newMov.type,
          sku: newMov.sku || 'SKU-GENERIC',
          itemName: newMov.itemName || 'Stock Item',
          quantity: Number(newMov.quantity),
          warehouse: newMov.warehouse,
        }),
      });
      setIsInvOpen(false);
      setNewMov({ type: 'Stock In', sku: '', itemName: '', quantity: 1, warehouse: warehouses[0]?.name || 'Main HQ Warehouse' });
      window.dispatchEvent(new CustomEvent('refresh-inventory'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset error when any modal closes
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
          <form onSubmit={handleTxSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive font-medium">{error}</div>}
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={txType === "Invoice" ? "default" : "outline"} onClick={() => setTxType("Invoice")} className="cursor-pointer">
                  Invoice (Receivable)
                </Button>
                <Button type="button" variant={txType === "Expense" ? "default" : "outline"} onClick={() => setTxType("Expense")} className="cursor-pointer">
                  Expense (Payable)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{txType === "Invoice" ? "Client Name" : "Vendor Name"}</Label>
              <Input required placeholder="e.g. Stark Industries" value={txCustomerName} onChange={(e) => setTxCustomerName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" required min="1" placeholder="5000" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="date" required value={txDueDate} onChange={(e) => setTxDueDate(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="status" checked={txStatus === "Paid"} onChange={() => setTxStatus("Paid")} className="accent-primary cursor-pointer h-4 w-4" /> Paid
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="status" checked={txStatus === "Pending"} onChange={() => setTxStatus("Pending")} className="accent-primary cursor-pointer h-4 w-4" /> Pending
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
          <form onSubmit={handleCustSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Customer Profile</DialogTitle>
              <DialogDescription>Create a customer profile to track credit limits and invoices.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Customer / Company Name</Label>
                <Input required placeholder="e.g. Apex Global" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Billing Email</Label>
                  <Input type="email" placeholder="billing@apex.com" value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+1 (555) 000-0000" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Approved Credit Limit ($)</Label>
                <Input type="number" placeholder="10000" value={newCust.creditLimit} onChange={(e) => setNewCust({ ...newCust, creditLimit: e.target.value })} />
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
          <form onSubmit={handleSupSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Supplier / Vendor</DialogTitle>
              <DialogDescription>Register a vendor to manage purchase bills and payable amounts.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input required placeholder="e.g. AWS Cloud" value={newSup.name} onChange={(e) => setNewSup({ ...newSup, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="e.g. Infrastructure" value={newSup.category} onChange={(e) => setNewSup({ ...newSup, category: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Billing Email</Label>
                  <Input type="email" placeholder="billing@vendor.com" value={newSup.email} onChange={(e) => setNewSup({ ...newSup, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input placeholder="Net 30" value={newSup.terms} onChange={(e) => setNewSup({ ...newSup, terms: e.target.value })} />
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
          <form onSubmit={handleProdSubmit}>
            <DialogHeader>
              <DialogTitle>Add Product to Catalog</DialogTitle>
              <DialogDescription>Configure pricing, SKU, barcode, image URL, and stock levels.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input required placeholder="e.g. POS Smart Terminal V2" value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input placeholder="FF-POS-V2" value={newProd.sku} onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input placeholder="890123456789" value={newProd.barcode} onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Cost ($)</Label>
                  <Input type="number" placeholder="220.00" value={newProd.purchasePrice} onChange={(e) => setNewProd({ ...newProd, purchasePrice: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price ($)</Label>
                  <Input type="number" required placeholder="349.00" value={newProd.sellingPrice} onChange={(e) => setNewProd({ ...newProd, sellingPrice: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Product Image URL</Label>
                <Input placeholder="https://images.unsplash.com/photo-1556742049-0a6792357321" value={newProd.imageUrl} onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Initial Stock Quantity</Label>
                <Input type="number" placeholder="10" value={newProd.stockQuantity} onChange={(e) => setNewProd({ ...newProd, stockQuantity: e.target.value })} />
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
          <form onSubmit={handleInvSubmit}>
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
              <DialogDescription>Add stock in, stock out, transfers, or damaged stock write-offs.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select value={newMov.type} onValueChange={(val: any) => setNewMov({ ...newMov, type: val })}>
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
                <Input required placeholder="e.g. Thermal Receipt Paper" value={newMov.itemName} onChange={(e) => setNewMov({ ...newMov, itemName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input required placeholder="FF-TRP-80" value={newMov.sku} onChange={(e) => setNewMov({ ...newMov, sku: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={newMov.quantity} onChange={(e) => setNewMov({ ...newMov, quantity: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Warehouse</Label>
                {warehouses.length > 0 ? (
                  <Select value={newMov.warehouse} onValueChange={(val) => setNewMov({ ...newMov, warehouse: val })}>
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
                  <Input value={newMov.warehouse} onChange={(e) => setNewMov({ ...newMov, warehouse: e.target.value })} />
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
    </>
  );
}
