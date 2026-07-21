'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ReportSummary {
  id: string;
  name: string;
  category: 'Financial' | 'Tax' | 'Audit' | 'Management';
  lastGenerated: string;
  status: 'Ready' | 'Generating';
  format: 'PDF' | 'CSV' | 'XLSX';
}

const REPORTS: ReportSummary[] = [
  { id: '1', name: 'Profit & Loss Statement (P&L)', category: 'Financial', lastGenerated: '2026-07-18', status: 'Ready', format: 'PDF' },
  { id: '2', name: 'Balance Sheet Summary', category: 'Financial', lastGenerated: '2026-07-15', status: 'Ready', format: 'PDF' },
  { id: '3', name: 'Statement of Cash Flows', category: 'Financial', lastGenerated: '2026-07-19', status: 'Ready', format: 'PDF' },
  { id: '4', name: 'Accounts Receivable Aging Summary', category: 'Management', lastGenerated: '2026-07-20', status: 'Ready', format: 'CSV' },
  { id: '5', name: 'Sales Tax Compliance & Quarterly Audit', category: 'Tax', lastGenerated: '2026-07-10', status: 'Ready', format: 'PDF' },
  { id: '6', name: 'Vendor Expense & Outflow Analysis', category: 'Management', lastGenerated: '2026-07-17', status: 'Ready', format: 'XLSX' },
];

export default function ReportsPage() {
  const [reports] = useState<ReportSummary[]>(REPORTS);
  const [selectedPeriod, setSelectedPeriod] = useState('YTD 2026');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, view, and export official financial statements and compliance audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
            {['Q1 2026', 'Q2 2026', 'YTD 2026'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedPeriod === p ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" />
            Export Package (ZIP)
          </Button>
        </div>
      </div>

      {/* Featured Financial Statement Cards */}
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
              <span className="font-bold text-foreground">$142,850.00</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Operating Expenses</span>
              <span className="font-bold text-destructive">-$48,250.00</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span>Net Net Profit</span>
              <span className="text-emerald-600">$94,600.00</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 cursor-pointer">
              View P&L Report →
            </Button>
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
              <span className="font-bold text-foreground">$412,000.00</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Total Liabilities</span>
              <span className="font-bold text-amber-600">$85,000.00</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span>Owner Equity</span>
              <span className="text-primary">$327,000.00</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 cursor-pointer">
              View Balance Sheet →
            </Button>
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
              <span className="text-muted-foreground">Operating Activity</span>
              <span className="font-bold text-emerald-600">+$38,500.00</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-1.5">
              <span className="text-muted-foreground">Financing Outflow</span>
              <span className="font-bold text-muted-foreground">-$12,000.00</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span>Net Cash Increase</span>
              <span className="text-emerald-600">+$26,500.00</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 cursor-pointer">
              View Cash Flow →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports Catalog Table */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Generated Statements & Compliance Reports
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {r.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.lastGenerated}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {r.format}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 mr-1 inline" /> {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="cursor-pointer text-xs h-8">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
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
