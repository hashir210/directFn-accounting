'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Download,
  AlertCircle,
  Clock,
  FileText,
  DollarSign,
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

interface Supplier {
  id: string;
  name: string;
  category: string;
  contactEmail: string;
  paymentTerms: string;
  dueAmount: string;
  status: 'Preferred Vendor' | 'Active' | 'Payment Due';
}

const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Direct Hosting AWS Cloud',
    category: 'Infrastructure',
    contactEmail: 'billing@aws.amazon.com',
    paymentTerms: 'Net 15',
    dueAmount: '$4,800',
    status: 'Payment Due',
  },
  {
    id: 'sup-2',
    name: 'HQ Office Co-working Space',
    category: 'Real Estate & Facilities',
    contactEmail: 'rent@hqworkspace.com',
    paymentTerms: 'Net 30',
    dueAmount: '$3,500',
    status: 'Preferred Vendor',
  },
  {
    id: 'sup-3',
    name: 'Vercel Deployment Systems',
    category: 'Software License',
    contactEmail: 'enterprise@vercel.com',
    paymentTerms: 'Annual Contract',
    dueAmount: '$1,200',
    status: 'Active',
  },
  {
    id: 'sup-4',
    name: 'Global Hardware Supply Co',
    category: 'POS Devices & Equipment',
    contactEmail: 'orders@globalhardware.com',
    paymentTerms: 'Net 45',
    dueAmount: '$10,200',
    status: 'Payment Due',
  },
];

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [newSup, setNewSup] = useState({ name: '', category: '', email: '', terms: 'Net 30' });

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSup.name || 'New Vendor',
      category: newSup.category || 'General',
      contactEmail: newSup.email || 'vendor@example.com',
      paymentTerms: newSup.terms,
      dueAmount: '$0',
      status: 'Active',
    };
    setSuppliers([created, ...suppliers]);
    setOpenAdd(false);
    setNewSup({ name: '', category: '', email: '', terms: 'Net 30' });
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Truck className="h-4 w-4" />
            <span>Accounts Payable</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage vendor profiles, purchase order histories, payment terms, and pending accounts payable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Export Ledger
          </Button>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSupplier}>
                <DialogHeader>
                  <DialogTitle>Add New Supplier / Vendor</DialogTitle>
                  <DialogDescription>
                    Register a vendor to manage purchase bills and payable amounts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Supplier Name</Label>
                    <Input
                      required
                      placeholder="e.g. AWS Cloud"
                      value={newSup.name}
                      onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        placeholder="e.g. Infrastructure"
                        value={newSup.category}
                        onChange={(e) => setNewSup({ ...newSup, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Email</Label>
                      <Input
                        type="email"
                        required
                        placeholder="billing@vendor.com"
                        value={newSup.email}
                        onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Input
                      placeholder="Net 30"
                      value={newSup.terms}
                      onChange={(e) => setNewSup({ ...newSup, terms: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Vendor</Button>
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
            <CardDescription>Total Vendors</CardDescription>
            <CardTitle className="text-2xl font-bold">{suppliers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 font-medium">12 Preferred Partners</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Due Payments</CardDescription>
            <CardTitle className="text-2xl font-bold">$19,700</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Due in next 14 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Purchase Orders</CardDescription>
            <CardTitle className="text-2xl font-bold">17 Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Awaiting Delivery</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Bill Approvals</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">3 Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-blue-600 font-medium">Approval Required</div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Supplier Directory & Payables</CardTitle>
              <CardDescription>View supplier records and due bills.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendor or category..."
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
                <TableHead>Vendor Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Due Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.contactEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {s.status === 'Preferred Vendor' && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Preferred</Badge>
                    )}
                    {s.status === 'Active' && (
                      <Badge variant="outline">Active</Badge>
                    )}
                    {s.status === 'Payment Due' && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Payment Due</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{s.paymentTerms}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">{s.dueAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
