'use client';

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  Barcode,
  Tag,
  DollarSign,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  purchasePrice: string;
  sellingPrice: string;
  taxRate: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'FinFlow POS Smart Terminal V2',
    sku: 'FF-POS-V2',
    barcode: '890123456789',
    category: 'Hardware & POS',
    unit: 'Unit',
    purchasePrice: '$220.00',
    sellingPrice: '$349.00',
    taxRate: '8%',
    status: 'In Stock',
  },
  {
    id: 'prod-2',
    name: 'Thermal Receipt Paper Roll 80mm',
    sku: 'FF-TRP-80',
    barcode: '890987654321',
    category: 'Consumables',
    unit: 'Box (50 Rolls)',
    purchasePrice: '$18.50',
    sellingPrice: '$35.00',
    taxRate: '5%',
    status: 'Low Stock',
  },
  {
    id: 'prod-3',
    name: 'FinFlow Wireless NFC Reader',
    sku: 'FF-NFC-R1',
    barcode: 'N/A',
    category: 'Hardware & POS',
    unit: 'Unit',
    purchasePrice: '$45.00',
    sellingPrice: '$89.00',
    taxRate: '8%',
    status: 'Out of Stock',
  },
  {
    id: 'prod-4',
    name: 'Enterprise Cloud Backup Module',
    sku: 'FF-SW-BCK',
    barcode: 'DIGITAL-SKU',
    category: 'Software Addon',
    unit: 'License/Year',
    purchasePrice: '$100.00',
    sellingPrice: '$299.00',
    taxRate: '0%',
    status: 'In Stock',
  },
];

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Hardware',
    unit: 'Unit',
    purchasePrice: '$0',
    sellingPrice: '$0',
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Product = {
      id: `prod-${Date.now()}`,
      name: newProd.name || 'New Item',
      sku: newProd.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: newProd.barcode || 'N/A',
      category: newProd.category,
      unit: newProd.unit,
      purchasePrice: newProd.purchasePrice,
      sellingPrice: newProd.sellingPrice,
      taxRate: '5%',
      status: 'In Stock',
    };
    setProducts([created, ...products]);
    setOpenAdd(false);
    setNewProd({ name: '', sku: '', barcode: '', category: 'Hardware', unit: 'Unit', purchasePrice: '$0', sellingPrice: '$0' });
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Package className="h-4 w-4" />
            <span>Catalog & Inventory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories, SKUs, barcodes, cost prices, selling margins, tax profiles, and product images.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Export Catalog
          </Button>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleCreateProduct}>
                <DialogHeader>
                  <DialogTitle>Add Product to Catalog</DialogTitle>
                  <DialogDescription>Configure pricing, SKU, barcode, and tax profiles.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input
                      required
                      placeholder="e.g. POS Smart Terminal V2"
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        placeholder="FF-POS-V2"
                        value={newProd.sku}
                        onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Barcode</Label>
                      <Input
                        placeholder="890123456789"
                        value={newProd.barcode}
                        onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Purchase Cost ($)</Label>
                      <Input
                        placeholder="$220.00"
                        value={newProd.purchasePrice}
                        onChange={(e) => setNewProd({ ...newProd, purchasePrice: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price ($)</Label>
                      <Input
                        placeholder="$349.00"
                        value={newProd.sellingPrice}
                        onChange={(e) => setNewProd({ ...newProd, sellingPrice: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Product</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-2xl font-bold">{products.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 font-medium">7 Active Categories</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Margin</CardDescription>
            <CardTitle className="text-2xl font-bold">36.5%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Across Sellable SKUs</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">1 SKU</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Thermal Paper (Reorder Needed)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Barcode Missing</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">1 Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-rose-600 font-medium">Needs Scan Code</div>
          </CardContent>
        </Card>
      </div>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Product Catalog & Pricing Matrix</CardTitle>
              <CardDescription>List of all SKUs, categories, costs, and selling prices.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search SKU or name..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.sku} • {p.unit}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Barcode className="h-3.5 w-3.5" /> {p.barcode}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.status === 'In Stock' && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">In Stock</Badge>
                    )}
                    {p.status === 'Low Stock' && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Low Stock</Badge>
                    )}
                    {p.status === 'Out of Stock' && (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">Out of Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{p.purchasePrice}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">{p.sellingPrice}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
