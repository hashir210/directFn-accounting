'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText,
  Download,
  TrendingUp,
  PieChart,
  BarChart3,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface IncomeReport {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
}

interface BalanceReport {
  assets?: { totalAssets: number };
  liabilities?: { totalLiabilities: number };
  equity?: { totalEquity: number };
}

interface CashFlowReport {
  summary?: {
    totalOperatingInflow: number;
    totalOperatingOutflow: number;
    netCashFlow: number;
  };
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());
  const [income, setIncome] = useState<IncomeReport | null>(null);
  const [balance, setBalance] = useState<BalanceReport | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [incomeData, balanceData, cashData] = await Promise.all([
          apiFetch<IncomeReport>(`/api/v1/reports/income-statement?year=${selectedPeriod}`),
          apiFetch<BalanceReport>('/api/v1/reports/balance-sheet'),
          apiFetch<CashFlowReport>(`/api/v1/reports/cash-flow?year=${selectedPeriod}`),
        ]);
        setIncome(incomeData);
        setBalance(balanceData);
        setCashFlow(cashData);
      } catch {
        setIncome(null);
        setBalance(null);
        setCashFlow(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedPeriod]);

  const handleExportReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, view, and export official financial statements and compliance audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
            {[2026, 2025, 2024].map((y) => (
              <button
                key={y}
                onClick={() => setSelectedPeriod(y.toString())}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedPeriod === y.toString() ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <Button onClick={handleExportReport} variant="outline" size="sm" className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" />
            Print / Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold">Income Statement</CardTitle>
              <CardDescription className="text-xs">Revenue & Expense Breakdown</CardDescription>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Gross Revenue</span>
              <span className="font-bold text-foreground">${(income?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Operating Expenses</span>
              <span className="font-bold text-destructive">-${(income?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span>Net Profit</span>
              <span className={(income?.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                {(income?.netProfit ?? 0) >= 0 ? '+' : '-'}${Math.abs(income?.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Margin: {(income?.grossMargin || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold">Balance Sheet</CardTitle>
              <CardDescription className="text-xs">Assets, Liabilities & Equity</CardDescription>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Total Assets</span>
              <span className="font-bold text-foreground">${(balance?.assets?.totalAssets || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Total Liabilities</span>
              <span className="font-bold text-amber-600">${(balance?.liabilities?.totalLiabilities || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span>Owner Equity</span>
              <span className="text-primary">${(balance?.equity?.totalEquity || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold">Cash Flow Statement</CardTitle>
              <CardDescription className="text-xs">Operating & Investing Inflows</CardDescription>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Operating Inflow</span>
              <span className="font-bold text-emerald-600">+${(cashFlow?.summary?.totalOperatingInflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Operating Outflow</span>
              <span className="font-bold text-muted-foreground">-${(cashFlow?.summary?.totalOperatingOutflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span>Net Cash Flow</span>
              <span className={(cashFlow?.summary?.netCashFlow || 0) >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                {(cashFlow?.summary?.netCashFlow || 0) >= 0 ? '+' : '-'}${Math.abs(cashFlow?.summary?.netCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {selectedPeriod} Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: 'Total Revenue', value: income?.totalRevenue || 0, positive: true },
                { label: 'Total Expenses', value: -(income?.totalExpenses || 0), positive: false },
                { label: 'Net Profit', value: income?.netProfit || 0, positive: (income?.netProfit || 0) >= 0 },
                { label: 'Operating Cash Flow', value: cashFlow?.summary?.netCashFlow || 0, positive: (cashFlow?.summary?.netCashFlow || 0) >= 0 },
              ].map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold text-xs">{row.label}</TableCell>
                  <TableCell className={`font-bold text-xs ${row.positive ? 'text-emerald-600' : 'text-destructive'}`}>
                    {row.positive ? '+' : '-'}${Math.abs(row.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.positive ? 'secondary' : 'destructive'} className="text-[10px]">
                      {row.positive ? 'Profitable' : 'Loss'}
                    </Badge>
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
