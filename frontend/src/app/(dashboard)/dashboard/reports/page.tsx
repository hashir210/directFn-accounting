'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  BarChart4, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Box, 
  Receipt,
  FileText,
  DollarSign
} from 'lucide-react';

const reportCategories = [
  {
    title: 'Financial Statements',
    description: 'Core financial reports to understand the overall health of your business.',
    reports: [
      { id: 'profit-loss', title: 'Profit & Loss', description: 'Income, expenses, and net profit over time.', icon: LineChart, active: true },
      { id: 'balance-sheet', title: 'Balance Sheet', description: 'What you own (assets) and what you owe (liabilities).', icon: BarChart4, active: false },
      { id: 'cash-flow', title: 'Cash Flow', description: 'Money moving in and out of your business.', icon: TrendingUp, active: false },
    ]
  },
  {
    title: 'Sales & Customers',
    description: 'Insights into your revenue streams and customer behavior.',
    reports: [
      { id: 'sales', title: 'Sales Report', description: 'Total sales grouped by customer and time.', icon: TrendingUp, active: true },
      { id: 'income', title: 'Income Report', description: 'Detailed breakdown of all income sources.', icon: DollarSign, active: false },
      { id: 'customer-statement', title: 'Customer Statement', description: 'Account balance and transaction history per customer.', icon: Users, active: false },
    ]
  },
  {
    title: 'Purchases & Suppliers',
    description: 'Track where your money is going and who you owe.',
    reports: [
      { id: 'expenses', title: 'Expense Report', description: 'Breakdown of your spending by category.', icon: PieChart, active: true },
      { id: 'purchases', title: 'Purchase Report', description: 'Total purchases made from suppliers.', icon: ShoppingCart, active: false },
      { id: 'supplier-statement', title: 'Supplier Statement', description: 'Account balance and transaction history per supplier.', icon: FileText, active: false },
    ]
  },
  {
    title: 'Inventory & Tax',
    description: 'Manage your stock valuation and tax liabilities.',
    reports: [
      { id: 'inventory', title: 'Inventory Valuation', description: 'Total value of items currently in stock.', icon: Box, active: false },
      { id: 'tax', title: 'Tax Report', description: 'Sales tax collected vs purchase tax paid.', icon: Receipt, active: false },
    ]
  }
];

export default function ReportsHubPage() {
  const router = useRouter();

  const handleReportClick = (id: string, active: boolean) => {
    if (active) {
      router.push(`/dashboard/reports/${id}`);
    }
  };

  return (
    <div className="space-y-8 pb-8 animate-in fade-in zoom-in duration-300">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Reports Center</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive financial and operational insights for your organization.
        </p>
      </div>

      <div className="space-y-10">
        {reportCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{category.title}</h2>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.reports.map((report) => (
                <Card 
                  key={report.id} 
                  className={`border-border/50 transition-all duration-200 ${report.active ? 'hover:shadow-md hover:border-primary/30 cursor-pointer group' : 'opacity-70 grayscale-[30%] cursor-not-allowed'}`}
                  onClick={() => handleReportClick(report.id, report.active)}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className={`p-2 rounded-lg ${report.active ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors' : 'bg-muted text-muted-foreground'}`}>
                      <report.icon className="h-5 w-5" />
                    </div>
                    {!report.active && (
                      <Badge variant="outline" className="text-[10px] font-semibold bg-muted/50">COMING SOON</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-1">{report.title}</CardTitle>
                    <CardDescription className="text-sm leading-snug">{report.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
