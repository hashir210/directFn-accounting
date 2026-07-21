'use client';

import React, { useState } from 'react';
import {
  Warehouse,
  Plus,
  Search,
  ArrowRightLeft,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  PackageCheck,
  PackageX,
  History,
  Building,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StockMovement {
  id: string;
  type: 'Stock In' | 'Stock Out' | 'Transfer' | 'Damaged' | 'Adjustment';
  sku: string;
  itemName: string;
  quantity: number;
  warehouse: string;
  date: string;
  status: 'Completed' | 'In Transit' | 'Pending Review';
}

const mockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    type: 'Stock In',
    sku: 'FF-POS-V2',
    itemName: 'FinFlow POS Smart Terminal V2',
    quantity: 25,
    warehouse: 'Main HQ Warehouse',
    date: 'Jul 20, 2026',
    status: 'Completed',
  },
  {
    id: 'mov-2',
    type: 'Transfer',
    sku: 'FF-TRP-80',
    itemName: 'Thermal Receipt Paper Roll',
    quantity: 50,
    warehouse: 'HQ -> Showroom Hub',
    date: 'Jul 19, 2026',
    status: 'In Transit',
  },
  {
    id: 'mov-3',
    type: 'Damaged',
    sku: 'FF-NFC-R1',
    itemName: 'Wireless NFC Reader',
    quantity: 3,
    warehouse: 'Main HQ Warehouse',
    date: 'Jul 18, 2026',
    status: 'Pending Review',
  },
  {
    id: 'mov-4',
    type: 'Adjustment',
    sku: 'FF-SW-BCK',
    itemName: 'Cloud Backup License Pack',
    quantity: 10,
    warehouse: 'Digital Vault',
    date: 'Jul 15, 2026',
    status: 'Completed',
  },
];

export default function InventoryManagementPage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockMovements);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [newMov, setNewMov] = useState({
    type: 'Stock In' as StockMovement['type'],
    sku: '',
    itemName: '',
    quantity: 1,
    warehouse: 'Main HQ Warehouse',
  });

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const created: StockMovement = {
      id: `mov-${Date.now()}`,
      type: newMov.type,
      sku: newMov.sku || 'SKU-GENERIC',
      itemName: newMov.itemName || 'Stock Item',
      quantity: Number(newMov.quantity),
      warehouse: newMov.warehouse,
      date: 'Today',
      status: 'Completed',
    };
    setMovements([created, ...movements]);
    setOpenAdd(false);
    setNewMov({ type: 'Stock In', sku: '', itemName: '', quantity: 1, warehouse: 'Main HQ Warehouse' });
  };

  const filtered = movements.filter(
    (m) =>
      m.itemName.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Warehouse className="h-4 w-4" />
            <span>Stock Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">
            Track stock in/out, inter-warehouse transfers, damaged inventory, stock adjustments, and low stock alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Stock Audit Log
          </Button>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Record Movement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleRecordMovement}>
                <DialogHeader>
                  <DialogTitle>Record Stock Movement</DialogTitle>
                  <DialogDescription>Add stock in, stock out, transfers, or damaged stock write-offs.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Movement Type</Label>
                    <Select
                      value={newMov.type}
                      onValueChange={(val) => setNewMov({ ...newMov, type: val as StockMovement['type'] })}
                    >
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
                    <Input
                      required
                      placeholder="e.g. Thermal Receipt Paper"
                      value={newMov.itemName}
                      onChange={(e) => setNewMov({ ...newMov, itemName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        placeholder="FF-TRP-80"
                        value={newMov.sku}
                        onChange={(e) => setNewMov({ ...newMov, sku: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newMov.quantity}
                        onChange={(e) => setNewMov({ ...newMov, quantity: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Warehouse</Label>
                    <Input
                      value={newMov.warehouse}
                      onChange={(e) => setNewMov({ ...newMov, warehouse: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Record</Button>
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
            <CardDescription>Total On-Hand Inventory</CardDescription>
            <CardTitle className="text-2xl font-bold">$142,500</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 font-medium">Across 3 Warehouses</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stock Transfers in Transit</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">11 Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Inter-branch Movement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Damaged Stock Write-offs</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">6 Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Pending Audit Review
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warehouse Locations</CardDescription>
            <CardTitle className="text-2xl font-bold">3 Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Building className="h-3.5 w-3.5" /> Main HQ, Showroom, Storage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Stock Movement Register</CardTitle>
              <CardDescription>Audit history of stock ins, outs, transfers, and adjustments.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by type, item, or SKU..."
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
                <TableHead>Movement Type</TableHead>
                <TableHead>Item & SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Warehouse Location</TableHead>
                <TableHead>Date Recorded</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.type === 'Stock In' && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Stock In</Badge>
                    )}
                    {m.type === 'Transfer' && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Transfer</Badge>
                    )}
                    {m.type === 'Damaged' && (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">Damaged</Badge>
                    )}
                    {m.type === 'Adjustment' && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Adjustment</Badge>
                    )}
                    {m.type === 'Stock Out' && (
                      <Badge variant="outline">Stock Out</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{m.itemName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.sku}</div>
                  </TableCell>
                  <TableCell className="font-mono font-bold">{m.quantity}</TableCell>
                  <TableCell className="text-sm">{m.warehouse}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.date}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-xs">{m.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
