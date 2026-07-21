'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  TrendingUp,
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface PaymentTransaction {
  id: string;
  txNo: string;
  method: 'Visa' | 'Mastercard' | 'ACH Wire' | 'Apple Pay';
  customerName: string;
  amount: number;
  fee: number;
  status: 'completed' | 'processing' | 'failed';
  timestamp: string;
}

const INITIAL_PAYMENTS: PaymentTransaction[] = [
  { id: '1', txNo: 'TXN-902148', method: 'Visa', customerName: 'Acme Global Corp', amount: 14500.00, fee: 290.00, status: 'completed', timestamp: '2026-07-18 14:32' },
  { id: '2', txNo: 'TXN-902149', method: 'ACH Wire', customerName: 'Apex Technologies', amount: 8200.50, fee: 15.00, status: 'completed', timestamp: '2026-07-18 11:15' },
  { id: '3', txNo: 'TXN-902150', method: 'Mastercard', customerName: 'Starlight Retail LLC', amount: 3950.00, fee: 79.00, status: 'processing', timestamp: '2026-07-19 09:40' },
  { id: '4', txNo: 'TXN-902151', method: 'Visa', customerName: 'Nexus Digital Solutions', amount: 22400.00, fee: 448.00, status: 'completed', timestamp: '2026-07-19 16:05' },
  { id: '5', txNo: 'TXN-902152', method: 'Apple Pay', customerName: 'Vanguard Capital', amount: 12100.00, fee: 242.00, status: 'completed', timestamp: '2026-07-20 08:22' },
  { id: '6', txNo: 'TXN-902153', method: 'Visa', customerName: 'Horizon Media Group', amount: 4350.00, fee: 87.00, status: 'failed', timestamp: '2026-07-20 10:14' },
];

export default function PaymentsPage() {
  const [payments] = useState<PaymentTransaction[]>(INITIAL_PAYMENTS);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.txNo.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.method.toLowerCase().includes(methodFilter.toLowerCase());
    return matchesSearch && matchesMethod;
  });

  const totalVolume = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalFees = payments.reduce((acc, p) => acc + p.fee, 0);
  const netSettlement = totalVolume - totalFees;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments & Settlements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor incoming merchant payments, settlement balances, and processing gateway logs.
          </p>
        </div>

        <Button className="cursor-pointer">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          Process Manual Payout
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Processing Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-emerald-600 mt-1">+12.4% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Net Settlement</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${netSettlement.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for transfer</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Gateway Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">${totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Average fee 2.1%</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">98.3%</div>
            <p className="text-xs text-emerald-600/80 mt-1">Low failure margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transaction # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
                {['all', 'visa', 'mastercard', 'ach'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                      methodFilter === m ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <Button variant="outline" size="sm" className="cursor-pointer text-xs h-9">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No payment transactions found matching criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {p.txNo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {p.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{p.customerName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.timestamp}</TableCell>
                    <TableCell className="font-bold text-xs">
                      ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      ${p.fee.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === 'completed' ? 'secondary' : p.status === 'processing' ? 'outline' : 'destructive'}
                        className={`text-[10px] capitalize ${
                          p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''
                        } ${p.status === 'processing' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}`}
                      >
                        {p.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                        {p.status === 'processing' && <Clock className="h-3 w-3 mr-1 inline" />}
                        {p.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
