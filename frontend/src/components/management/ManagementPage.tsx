import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ContactRound,
  Download,
  Factory,
  FileText,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type IconType = ComponentType<{ className?: string }>;

interface StatItem {
  label: string;
  value: string;
  detail: string;
  tone?: "green" | "amber" | "red" | "blue";
}

interface RecordItem {
  primary: string;
  secondary: string;
  meta: string;
  status: string;
  amount: string;
}

interface FieldItem {
  label: string;
  value: string;
}

interface ManagementConfig {
  eyebrow: string;
  title: string;
  description: string;
  icon: IconType;
  action: string;
  stats: StatItem[];
  fields: FieldItem[];
  records: RecordItem[];
  workflows: string[];
  audit: string[];
}

type ManagementType = "company" | "customers" | "suppliers" | "products" | "inventory";

const configs: Record<ManagementType, ManagementConfig> = {
  company: {
    eyebrow: "Company management",
    title: "Company Profile",
    description: "Control legal identity, tax details, fiscal settings, logo, address, currency, and timezone.",
    icon: Building2,
    action: "Update profile",
    stats: [
      { label: "Fiscal year", value: "Jan-Dec", detail: "Default accounting period", tone: "green" },
      { label: "Currency", value: "USD", detail: "Primary reporting currency", tone: "blue" },
      { label: "Tax ID", value: "GST-48291", detail: "Verified registration", tone: "green" },
      { label: "Branches", value: "03", detail: "HQ plus operating sites", tone: "amber" },
    ],
    fields: [
      { label: "Company name", value: "DirectFN Finance" },
      { label: "GST / VAT number", value: "GST-48291-DFN" },
      { label: "Registered address", value: "742 Market Street, Suite 410, New York, NY" },
      { label: "Fiscal year", value: "January 1 to December 31" },
      { label: "Currency", value: "USD - United States Dollar" },
      { label: "Time zone", value: "Asia/Karachi" },
    ],
    records: [
      { primary: "HQ operating profile", secondary: "Legal, tax, and mailing defaults", meta: "Updated today", status: "Active", amount: "Core" },
      { primary: "Logo and invoice header", secondary: "Brand assets for PDFs and emails", meta: "Draft ready", status: "Review", amount: "Design" },
      { primary: "Fiscal calendar", secondary: "Year close, tax periods, and lock dates", meta: "12 periods", status: "Configured", amount: "Policy" },
    ],
    workflows: ["Company details", "Tax registration", "Fiscal year", "Currency and time zone", "Invoice branding"],
    audit: ["GST number checked", "Invoice footer pending approval", "Default timezone changed by Admin User"],
  },
  customers: {
    eyebrow: "Customer management",
    title: "Customer Directory",
    description: "Review customer profiles, credit limits, outstanding balances, transactions, and statements.",
    icon: ContactRound,
    action: "Add customer",
    stats: [
      { label: "Active customers", value: "128", detail: "18 high-value accounts", tone: "green" },
      { label: "Outstanding", value: "$84.2K", detail: "Across 31 invoices", tone: "amber" },
      { label: "Credit holds", value: "04", detail: "Require review", tone: "red" },
      { label: "Statements", value: "22", detail: "Ready this month", tone: "blue" },
    ],
    fields: [
      { label: "Profile fields", value: "Name, email, phone, tax number, billing address" },
      { label: "Credit controls", value: "Credit limit, outstanding balance, overdue threshold" },
      { label: "Statement cadence", value: "Monthly statement generation" },
      { label: "Transaction view", value: "Invoices, payments, adjustments, and notes" },
    ],
    records: [
      { primary: "Apex Global Systems", secondary: "billing@apexglobal.com", meta: "Credit limit $50,000", status: "Current", amount: "$24,500" },
      { primary: "Horizon Ventures", secondary: "finance@horizon.vc", meta: "2 overdue invoices", status: "Watch", amount: "$32,100" },
      { primary: "Acme Corporation", secondary: "accounting@acme.com", meta: "Statement ready", status: "Pending", amount: "$15,300" },
    ],
    workflows: ["Customer profile", "Credit limit", "Outstanding balance", "Transaction history", "Statements"],
    audit: ["Credit limit review queued", "Monthly statements generated", "Overdue notice prepared"],
  },
  suppliers: {
    eyebrow: "Supplier management",
    title: "Supplier Ledger",
    description: "Track supplier details, purchase history, due payments, contacts, and account terms.",
    icon: Truck,
    action: "Add supplier",
    stats: [
      { label: "Suppliers", value: "46", detail: "12 preferred vendors", tone: "green" },
      { label: "Due payments", value: "$19.7K", detail: "Next 14 days", tone: "amber" },
      { label: "Late bills", value: "03", detail: "Approval required", tone: "red" },
      { label: "POs open", value: "17", detail: "Awaiting delivery", tone: "blue" },
    ],
    fields: [
      { label: "Supplier details", value: "Company, contact, payment terms, tax ID" },
      { label: "Purchase history", value: "Orders, bills, returns, and adjustments" },
      { label: "Due payments", value: "Upcoming liabilities grouped by supplier" },
      { label: "Risk notes", value: "Late delivery, pricing, and compliance flags" },
    ],
    records: [
      { primary: "Direct Hosting AWS", secondary: "Cloud infrastructure vendor", meta: "Net 15", status: "Due soon", amount: "$4,800" },
      { primary: "HQ Office Co-working", secondary: "Office rent and utilities", meta: "Monthly", status: "Approved", amount: "$3,500" },
      { primary: "Vercel Enterprise", secondary: "Deployment platform", meta: "Annual contract", status: "Current", amount: "$1,200" },
    ],
    workflows: ["Supplier details", "Purchase history", "Due payments", "Payment terms", "Compliance notes"],
    audit: ["Three vendor bills ready for approval", "Payment terms normalized", "New supplier onboarding checklist drafted"],
  },
  products: {
    eyebrow: "Product management",
    title: "Product Catalog",
    description: "Manage categories, units, barcodes, SKUs, purchase price, selling price, taxes, and images.",
    icon: Package,
    action: "Add product",
    stats: [
      { label: "Products", value: "312", detail: "7 categories", tone: "green" },
      { label: "Low stock SKUs", value: "09", detail: "Need replenishment", tone: "amber" },
      { label: "No barcode", value: "14", detail: "Catalog cleanup", tone: "red" },
      { label: "Avg margin", value: "31%", detail: "Across sellable items", tone: "blue" },
    ],
    fields: [
      { label: "Catalog fields", value: "Category, unit, barcode, SKU, image" },
      { label: "Pricing", value: "Purchase price, selling price, tax profile" },
      { label: "Inventory link", value: "Stock quantity, reorder point, warehouse" },
      { label: "Controls", value: "Status, visibility, and approval flags" },
    ],
    records: [
      { primary: "FinFlow POS Terminal V2", secondary: "FF-POS-V2 - Hardware", meta: "Purchase $220 / Sell $349", status: "Low stock", amount: "3 units" },
      { primary: "Thermal Receipt Paper Roll", secondary: "FF-TRP-80 - Consumables", meta: "Taxable item", status: "Reorder", amount: "8 units" },
      { primary: "FinFlow NFC Reader", secondary: "FF-NFC-R1 - Hardware", meta: "Barcode missing", status: "Out", amount: "0 units" },
    ],
    workflows: ["Categories", "Units", "Barcode", "SKU", "Pricing", "Tax", "Images"],
    audit: ["Barcode cleanup list prepared", "Tax profile applied to hardware category", "Selling price review due"],
  },
  inventory: {
    eyebrow: "Inventory management",
    title: "Inventory Control",
    description: "Monitor stock in, stock out, transfers, damaged stock, adjustments, low stock alerts, and warehouses.",
    icon: Warehouse,
    action: "Record movement",
    stats: [
      { label: "On-hand value", value: "$142K", detail: "Across all warehouses", tone: "green" },
      { label: "Transfers", value: "11", detail: "In progress", tone: "blue" },
      { label: "Damaged stock", value: "06", detail: "Awaiting write-off", tone: "red" },
      { label: "Adjustments", value: "18", detail: "This month", tone: "amber" },
    ],
    fields: [
      { label: "Stock movement", value: "Stock in, stock out, transfer, return" },
      { label: "Adjustment reasons", value: "Damaged, lost, correction, opening balance" },
      { label: "Warehouse support", value: "HQ, showroom, and reserve stock locations" },
      { label: "Alerts", value: "Low stock, negative stock, reorder threshold" },
    ],
    records: [
      { primary: "Warehouse transfer", secondary: "HQ to Showroom", meta: "11 items", status: "In transit", amount: "$8,420" },
      { primary: "Damaged stock review", secondary: "NFC reader batch", meta: "6 units", status: "Write-off", amount: "$534" },
      { primary: "Stock adjustment", secondary: "Opening balance correction", meta: "18 SKUs", status: "Draft", amount: "$2,180" },
    ],
    workflows: ["Stock in", "Stock out", "Transfers", "Damaged stock", "Stock adjustment", "Low stock alerts", "Warehouses"],
    audit: ["Showroom transfer created", "Damaged batch isolated", "Low stock threshold matched to catalog"],
  },
};

const toneClass = {
  green: "text-emerald-700 bg-emerald-50 border-emerald-200",
  amber: "text-amber-700 bg-amber-50 border-amber-200",
  red: "text-rose-700 bg-rose-50 border-rose-200",
  blue: "text-blue-700 bg-blue-50 border-blue-200",
};

export function ManagementPage({ type }: { type: ManagementType }) {
  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            <span>{config.eyebrow}</span>
          </div>
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight">{config.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="cursor-pointer">
            <Plus className="h-4 w-4" />
            {config.action}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {config.stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-3">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3">
                <div className="text-2xl font-heading font-semibold">{stat.value}</div>
                <Badge variant="outline" className={toneClass[stat.tone || "blue"]}>
                  <ArrowUpRight className="h-3 w-3" />
                  Live
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Working Register</CardTitle>
                <CardDescription>Static UI preview for the next functional phase.</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-9 pl-8" placeholder="Search records..." />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.records.map((record) => (
                  <TableRow key={record.primary}>
                    <TableCell>
                      <div className="font-medium">{record.primary}</div>
                      <div className="text-xs text-muted-foreground">{record.secondary}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.meta}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{record.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Tabs defaultValue="setup" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup" className="cursor-pointer">Setup</TabsTrigger>
            <TabsTrigger value="controls" className="cursor-pointer">Controls</TabsTrigger>
            <TabsTrigger value="audit" className="cursor-pointer">Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle>Module Setup</CardTitle>
                <CardDescription>Fields and page areas planned from the phase list.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.fields.map((field) => (
                  <div key={field.label} className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</div>
                    <div className="mt-1 text-sm font-medium">{field.value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="controls">
            <Card>
              <CardHeader>
                <CardTitle>Expected Controls</CardTitle>
                <CardDescription>Controls are visual only until backend modules are added.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.workflows.map((workflow, index) => (
                  <div key={workflow} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{workflow}</div>
                      <Progress value={70 - index * 6} className="mt-2 h-1.5" />
                    </div>
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Audit trail preview for actions and approvals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.audit.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border bg-muted/10 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-sm font-medium">{item}</div>
                      <div className="text-xs text-muted-foreground">Static preview</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phase Coverage</CardTitle>
          <CardDescription>This page is a non-functional UI shell for the management phase.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Access rules", icon: ShieldCheck },
              { label: "Documents", icon: FileText },
              { label: "Operations", icon: Factory },
              { label: "Warehouse", icon: Warehouse },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
                  <ItemIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
