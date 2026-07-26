'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Download, Calendar, TrendingUp, Archive, FileText, BarChart2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PastArchive {
  year: string;
  totalRevenue: string;
  totalExpenses: string;
  netMargin: string;
  growth: string;
  auditStatus: string;
}

const HISTORICAL_DATA: PastArchive[] = [
  { year: 'FY 2025', totalRevenue: '$1,480,200.00', totalExpenses: '$520,400.00', netMargin: '$959,800.00', growth: '+28.4%', auditStatus: 'Audited & Locked' },
  { year: 'FY 2024', totalRevenue: '$1,152,000.00', totalExpenses: '$440,100.00', netMargin: '$711,900.00', growth: '+22.1%', auditStatus: 'Audited & Locked' },
  { year: 'FY 2023', totalRevenue: '$943,500.00', totalExpenses: '$380,000.00', netMargin: '$563,500.00', growth: '+18.5%', auditStatus: 'Audited & Locked' },
  { year: 'FY 2022', totalRevenue: '$795,000.00', totalExpenses: '$320,000.00', netMargin: '$475,000.00', growth: 'Base Year', auditStatus: 'Archived' },
];

function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function PastMetricsPage() {
  const [archives] = useState<PastArchive[]>(HISTORICAL_DATA);

  const handleExportArchive = () => {
    const headers = ['Fiscal Year', 'Total Revenue', 'Total Expenses', 'Net Margin', 'Growth', 'Audit Status'];
    const rows = archives.map((a) => [a.year, a.totalRevenue, a.totalExpenses, a.netMargin, a.growth, a.auditStatus]);
    downloadCSV(headers, rows, `historical_archive_${Date.now()}.csv`);
  };

  const handleExportLedger = (archive: PastArchive) => {
    const headers = ['Fiscal Year', 'Total Revenue', 'Total Expenses', 'Net Margin', 'Growth', 'Audit Status'];
    const rows = [[archive.year, archive.totalRevenue, archive.totalExpenses, archive.netMargin, archive.growth, archive.auditStatus]];
    downloadCSV(headers, rows, `ledger_${archive.year.replace(/\s+/g, '_')}_${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <Archive className="h-4 w-4" /> Historical Ledger
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Past Metrics & Annual Archives</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access past fiscal year ledgers, historical profit margins, and archived audit statements.
          </p>
        </div>

        <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleExportArchive}>
          <Download className="h-4 w-4 mr-1.5" /> Export Historical Archive (ZIP)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">3-Year Cumulative Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$3,575,700.00</div>
            <p className="text-xs text-emerald-600 mt-1">Consistent YoY CAGR +23.0%</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Expenses (3Y)</CardTitle>
            <BarChart2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$1,340,500.00</div>
            <p className="text-xs text-muted-foreground mt-1">37.5% expense-to-revenue ratio</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Combined Net Profit</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">$2,235,200.00</div>
            <p className="text-xs text-muted-foreground mt-1">62.5% average net margin</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Fiscal Year Archives
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fiscal Year</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Total Expenses</TableHead>
                <TableHead>Net Margin</TableHead>
                <TableHead>Growth</TableHead>
                <TableHead>Audit Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archives.map((a) => (
                <TableRow key={a.year} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-bold text-xs text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {a.year}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{a.totalRevenue}</TableCell>
                  <TableCell className="text-xs text-destructive">{a.totalExpenses}</TableCell>
                  <TableCell className="font-bold text-xs text-emerald-600">{a.netMargin}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-semibold text-primary">{a.growth}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">{a.auditStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="cursor-pointer text-xs h-8" onClick={() => handleExportLedger(a)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Ledger
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