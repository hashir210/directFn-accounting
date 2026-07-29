'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, FilePlus2, Landmark, Loader2, Plus, RefreshCw, Scale, WalletCards } from 'lucide-react';
import apiFetch from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Account = { id: string; code: string; name: string; type: string; parentId?: string | null; isActive: boolean; isSystem: boolean };
type EntryLine = { accountId: string; accountCode?: string; accountName?: string; debit: number; credit: number };
type Entry = { id: string; entryNo: string; date: string; description?: string | null; status: string; totalDebit: number; totalCredit: number; lines: EntryLine[] };
type LedgerLine = { id: string; entryNo: string; date: string; description?: string | null; accountCode: string; accountName: string; debit: number; credit: number };
type Trial = { rows: { code: string; name: string; type: string; debit: number; credit: number }[]; totalDebit: number; totalCredit: number; isBalanced: boolean };
type Statement = { accounts: { code: string; name: string; balance?: number; amount?: number }[]; total: number };

const types = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
const money = (value = 0) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const today = () => new Date().toISOString().slice(0, 10);

export default function AccountingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ledger, setLedger] = useState<LedgerLine[]>([]);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [balance, setBalance] = useState<{ assets: Statement; liabilities: Statement; equity: Statement; totalLiabilitiesAndEquity: number } | null>(null);
  const [profitLoss, setProfitLoss] = useState<{ income: Statement; expenses: Statement; netProfit: number } | null>(null);
  const [cashFlow, setCashFlow] = useState<{ summary: { totalOperatingInflow: number; totalOperatingOutflow: number; netCashFlow: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'ASSET' });
  const [entryDate, setEntryDate] = useState(today());
  const [entryDescription, setEntryDescription] = useState('');
  const [lines, setLines] = useState<EntryLine[]>([{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountData, entryData, ledgerData, trialData, balanceData, plData, cashData] = await Promise.all([
        apiFetch<Account[]>('/api/v1/accounts'), apiFetch<{ data: Entry[] }>('/api/v1/journal-entries?limit=50'),
        apiFetch<LedgerLine[]>('/api/v1/accounting/general-ledger'),
        apiFetch<Trial>('/api/v1/accounting/trial-balance'), apiFetch<typeof balance>('/api/v1/accounting/balance-sheet'),
        apiFetch<typeof profitLoss>('/api/v1/accounting/profit-loss'), apiFetch<typeof cashFlow>('/api/v1/accounting/cash-flow'),
      ]);
      setAccounts(accountData); setEntries(entryData.data); setLedger(ledgerData); setTrial(trialData); setBalance(balanceData); setProfitLoss(plData); setCashFlow(cashData);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  const debit = useMemo(() => lines.reduce((s, l) => s + Number(l.debit || 0), 0), [lines]);
  const credit = useMemo(() => lines.reduce((s, l) => s + Number(l.credit || 0), 0), [lines]);
  const setLine = (index: number, patch: Partial<EntryLine>) => setLines((current) => current.map((line, i) => i === index ? { ...line, ...patch } : line));

  async function seedChart() { setSaving(true); try { await apiFetch('/api/v1/accounts/seed', { method: 'POST' }); await load(); } finally { setSaving(false); } }
  async function createAccount(event: FormEvent) { event.preventDefault(); setSaving(true); try { await apiFetch('/api/v1/accounts', { method: 'POST', body: JSON.stringify(accountForm) }); setAccountOpen(false); setAccountForm({ code: '', name: '', type: 'ASSET' }); await load(); } finally { setSaving(false); } }
  async function createEntry(event: FormEvent) {
    event.preventDefault(); if (!lines.every((line) => line.accountId) || Math.abs(debit - credit) > .001) return;
    setSaving(true); try { await apiFetch('/api/v1/journal-entries', { method: 'POST', body: JSON.stringify({ date: entryDate, description: entryDescription, lines }) }); setEntryOpen(false); setEntryDescription(''); setLines([{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]); await load(); } finally { setSaving(false); }
  }
  async function postEntry(id: string) { setSaving(true); try { await apiFetch(`/api/v1/journal-entries/${id}/post`, { method: 'POST' }); await load(); } finally { setSaving(false); } }

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  const summary = [
    ['Assets', balance?.assets.total || 0, Landmark], ['Net income', profitLoss?.netProfit || 0, WalletCards], ['Net cash flow', cashFlow?.summary.netCashFlow || 0, Scale], ['Trial balance', trial?.isBalanced ? 'Balanced' : 'Review', BookOpen],
  ];
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Accounting</h1><p className="mt-1 text-sm text-muted-foreground">Manage your chart of accounts, journals, and financial statements.</p></div><div className="flex gap-2"><Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={() => setEntryOpen(true)}><FilePlus2 className="mr-2 h-4 w-4" />Journal entry</Button></div></div>
    <div className="grid gap-4 md:grid-cols-4">{summary.map(([label, value, Icon]) => <Card key={String(label)}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{label as string}</CardTitle><Icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><p className="text-xl font-bold">{typeof value === 'number' ? money(value) : value as string}</p></CardContent></Card>)}</div>
    <Tabs defaultValue="accounts"><TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-7"><TabsTrigger value="accounts">Chart of Accounts</TabsTrigger><TabsTrigger value="journals">Journal Entries</TabsTrigger><TabsTrigger value="ledger">General Ledger</TabsTrigger><TabsTrigger value="trial">Trial Balance</TabsTrigger><TabsTrigger value="balance">Balance Sheet</TabsTrigger><TabsTrigger value="profit">Profit & Loss</TabsTrigger><TabsTrigger value="cash">Cash Flow</TabsTrigger></TabsList>
      <TabsContent value="accounts"><Card className="shadow-none border-border"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Chart of Accounts</CardTitle><CardDescription>Assets, liabilities, equity, income, and expenses.</CardDescription></div><div className="flex gap-2"><Button variant="outline" onClick={seedChart} disabled={saving}>Seed defaults</Button><Button onClick={() => setAccountOpen(true)}><Plus className="mr-2 h-4 w-4" />Account</Button></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{accounts.length ? accounts.map(a => <TableRow key={a.id}><TableCell className="font-mono">{a.code}</TableCell><TableCell>{a.name}</TableCell><TableCell><Badge variant="outline">{a.type}</Badge></TableCell><TableCell>{a.isActive ? 'Active' : 'Inactive'}</TableCell></TableRow>) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No accounts yet. Seed the default chart to begin.</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="journals"><Card className="shadow-none border-border"><CardHeader><CardTitle>General Journal</CardTitle><CardDescription>Draft entries can be posted once reviewed. Income and expenses post automatically.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Entry</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Debit</TableHead><TableHead>Credit</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{entries.map(e => <TableRow key={e.id}><TableCell className="font-mono">{e.entryNo}</TableCell><TableCell>{e.date}</TableCell><TableCell>{e.description}</TableCell><TableCell>{money(e.totalDebit)}</TableCell><TableCell>{money(e.totalCredit)}</TableCell><TableCell><Badge variant={e.status === 'posted' ? 'default' : 'outline'}>{e.status}</Badge></TableCell><TableCell>{e.status !== 'posted' && <Button size="sm" onClick={() => postEntry(e.id)} disabled={saving}>Post</Button>}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="ledger"><Card className="shadow-none border-border"><CardHeader><CardTitle>General Ledger</CardTitle><CardDescription>All posted movements by account.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Entry</TableHead><TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead>Debit</TableHead><TableHead>Credit</TableHead></TableRow></TableHeader><TableBody>{ledger.length ? ledger.map(line => <TableRow key={line.id}><TableCell>{line.date}</TableCell><TableCell className="font-mono">{line.entryNo}</TableCell><TableCell>{line.accountCode} · {line.accountName}</TableCell><TableCell>{line.description}</TableCell><TableCell>{money(line.debit)}</TableCell><TableCell>{money(line.credit)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No posted journal entries yet.</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="trial"><ReportTable title="Trial Balance" rows={trial?.rows.map(r => ({ ...r, left: r.debit, right: r.credit })) || []} leftLabel="Debit" rightLabel="Credit" totalLeft={trial?.totalDebit || 0} totalRight={trial?.totalCredit || 0} /></TabsContent>
      <TabsContent value="balance"><div className="grid gap-4 md:grid-cols-2"><StatementCard title="Assets" data={balance?.assets} /><StatementCard title="Liabilities" data={balance?.liabilities} /><StatementCard title="Equity" data={balance?.equity} /><Card><CardHeader><CardTitle>Liabilities & Equity</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{money(balance?.totalLiabilitiesAndEquity || 0)}</CardContent></Card></div></TabsContent>
      <TabsContent value="profit"><div className="grid gap-4 md:grid-cols-2"><StatementCard title="Income" data={profitLoss?.income} /><StatementCard title="Expenses" data={profitLoss?.expenses} /><Card className="md:col-span-2"><CardHeader><CardTitle>Net Profit</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{money(profitLoss?.netProfit || 0)}</CardContent></Card></div></TabsContent>
      <TabsContent value="cash"><div className="grid gap-4 md:grid-cols-3"><MetricCard title="Operating Inflow" value={cashFlow?.summary.totalOperatingInflow || 0} /><MetricCard title="Operating Outflow" value={cashFlow?.summary.totalOperatingOutflow || 0} /><MetricCard title="Net Cash Flow" value={cashFlow?.summary.netCashFlow || 0} /></div></TabsContent>
    </Tabs>
    <Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent><form onSubmit={createAccount}><DialogHeader><DialogTitle>Add account</DialogTitle></DialogHeader><div className="space-y-3 py-4"><Label>Account code<Input required value={accountForm.code} onChange={e => setAccountForm({ ...accountForm, code: e.target.value })} /></Label><Label>Account name<Input required value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} /></Label><Label>Type<Select value={accountForm.type} onValueChange={val => setAccountForm({ ...accountForm, type: val })}><SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{types.map(type => <SelectItem value={type} key={type}>{type}</SelectItem>)}</SelectContent></Select></Label></div><DialogFooter><Button type="submit" disabled={saving}>Save account</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={entryOpen} onOpenChange={setEntryOpen}><DialogContent className="sm:max-w-2xl"><form onSubmit={createEntry}><DialogHeader><DialogTitle>New journal entry</DialogTitle></DialogHeader><div className="space-y-3 py-4"><div className="grid grid-cols-2 gap-3"><Label>Date<Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} /></Label><Label>Description<Input value={entryDescription} onChange={e => setEntryDescription(e.target.value)} /></Label></div>{lines.map((line, i) => <div key={i} className="grid grid-cols-[1fr_110px_110px] gap-2"><Select value={line.accountId} onValueChange={val => setLine(i, { accountId: val })} required><SelectTrigger className="w-full"><SelectValue placeholder="Select account" /></SelectTrigger><SelectContent>{accounts.filter(a => a.isActive).map(a => <SelectItem value={a.id} key={a.id}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select><Input type="number" min="0" step="0.01" placeholder="Debit" value={line.debit || ''} onChange={e => setLine(i, { debit: Number(e.target.value), credit: 0 })} /><Input type="number" min="0" step="0.01" placeholder="Credit" value={line.credit || ''} onChange={e => setLine(i, { credit: Number(e.target.value), debit: 0 })} /></div>)}<Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { accountId: '', debit: 0, credit: 0 }])}>Add line</Button><p className={Math.abs(debit - credit) < .001 ? 'text-sm text-emerald-600' : 'text-sm text-destructive'}>Debits {money(debit)} · Credits {money(credit)}</p></div><DialogFooter><Button type="submit" disabled={saving || Math.abs(debit - credit) > .001}>Save draft</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function ReportTable({ title, rows, leftLabel, rightLabel, totalLeft, totalRight }: { title: string; rows: { code: string; name: string; left: number; right: number }[]; leftLabel: string; rightLabel: string; totalLeft: number; totalRight: number }) { return <Card className="shadow-none border-border"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>{leftLabel}</TableHead><TableHead>{rightLabel}</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.code}><TableCell>{row.code}</TableCell><TableCell>{row.name}</TableCell><TableCell>{money(row.left)}</TableCell><TableCell>{money(row.right)}</TableCell></TableRow>)}<TableRow className="font-bold"><TableCell colSpan={2}>Total</TableCell><TableCell>{money(totalLeft)}</TableCell><TableCell>{money(totalRight)}</TableCell></TableRow></TableBody></Table></CardContent></Card>; }
function StatementCard({ title, data }: { title: string; data?: Statement }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{data?.accounts.length ? data.accounts.map(a => <div className="flex justify-between text-sm" key={a.code}><span>{a.code} · {a.name}</span><span className="font-medium">{money(a.balance ?? a.amount)}</span></div>) : <p className="text-sm text-muted-foreground">No posted activity.</p>}<div className="flex justify-between border-t pt-3 font-bold"><span>Total</span><span>{money(data?.total || 0)}</span></div></CardContent></Card>; }
function MetricCard({ title, value }: { title: string; value: number }) { return <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{money(value)}</CardContent></Card>; }
