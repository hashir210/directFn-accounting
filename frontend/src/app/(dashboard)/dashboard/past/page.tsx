'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Download, Calendar, TrendingUp, Archive, FileText, BarChart2, Loader2, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PastArchive {
  id: string;
  year: string;
  totalRevenue: number;
  totalExpenses: number;
  netMargin: number;
  growth: string | null;
  auditStatus: string;
}

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
  const [archives, setArchives] = useState<PastArchive[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ year: '', totalRevenue: '', totalExpenses: '', netMargin: '', growth: '', auditStatus: 'Archived' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<PastArchive[]>('/api/v1/archives');
      setArchives(res || []);
    } catch (err) {
      console.error('Failed to load archives', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportArchive = () => {
    const headers = ['Fiscal Year', 'Total Revenue', 'Total Expenses', 'Net Margin', 'Growth', 'Audit Status'];
    const rows = archives.map((a) => [a.year, a.totalRevenue, a.totalExpenses, a.netMargin, a.growth || '-', a.auditStatus]);
    downloadCSV(headers, rows, `historical_archive_${Date.now()}.csv`);
  };

  const handleExportLedger = (archive: PastArchive) => {
    const headers = ['Fiscal Year', 'Total Revenue', 'Total Expenses', 'Net Margin', 'Growth', 'Audit Status'];
    const rows = [[archive.year, archive.totalRevenue, archive.totalExpenses, archive.netMargin, archive.growth || '-', archive.auditStatus]];
    downloadCSV(headers, rows, `ledger_${archive.year.replace(/\s+/g, '_')}_${Date.now()}.csv`);
  };

  const handleSubmitManualArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/api/v1/archives', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsModalOpen(false);
      fetchArchives();
    } catch (err) {
      console.error('Failed to create archive', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cumulativeRev = archives.reduce((acc, a) => acc + Number(a.totalRevenue), 0);
  const cumulativeExp = archives.reduce((acc, a) => acc + Number(a.totalExpenses), 0);
  const cumulativeProfit = archives.reduce((acc, a) => acc + Number(a.netMargin), 0);

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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Record Archive
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleExportArchive}>
            <Download className="h-4 w-4 mr-1.5" /> Export All (CSV)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Cumulative Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">PKR {cumulativeRev.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 mt-1">Across all archived years</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Cumulative Expenses</CardTitle>
            <BarChart2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">PKR {cumulativeExp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Historical total</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Combined Net Profit</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">PKR {cumulativeProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Retained earnings</p>
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
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
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
                {archives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No archives found. Record one manually.</TableCell>
                  </TableRow>
                ) : archives.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-bold text-xs text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {a.year}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">PKR {Number(a.totalRevenue).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-destructive">PKR {Number(a.totalExpenses).toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-xs text-emerald-600">PKR {Number(a.netMargin).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold text-primary">{a.growth || '-'}</Badge>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Manual Archive</DialogTitle>
            <DialogDescription>Manually enter historical fiscal year data.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitManualArchive} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Fiscal Year</Label>
              <Input placeholder="e.g. FY 2024" required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Revenue (PKR)</Label>
                <Input type="number" required value={formData.totalRevenue} onChange={e => setFormData({...formData, totalRevenue: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Total Expenses (PKR)</Label>
                <Input type="number" required value={formData.totalExpenses} onChange={e => setFormData({...formData, totalExpenses: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Net Margin (PKR)</Label>
                <Input type="number" required value={formData.netMargin} onChange={e => setFormData({...formData, netMargin: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Growth (Optional)</Label>
                <Input placeholder="e.g. +10%" value={formData.growth} onChange={e => setFormData({...formData, growth: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Archive
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}