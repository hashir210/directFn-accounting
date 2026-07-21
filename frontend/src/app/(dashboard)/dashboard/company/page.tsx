'use client';

import React, { useState } from 'react';
import {
  Building2,
  Save,
  Globe,
  DollarSign,
  Clock,
  FileText,
  MapPin,
  Upload,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CompanyManagementPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState({
    companyName: 'DirectFN Accounting Systems',
    taxNumber: 'GST-98420-DFN',
    vatNumber: 'VAT-US-991204',
    address: '742 Market Street, Suite 410, New York, NY 10001',
    fiscalYear: 'jan-dec',
    currency: 'USD',
    timeZone: 'UTC-5',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Building2 className="h-4 w-4" />
            <span>Organization Settings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Company Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your legal entity details, tax registration, currency defaults, and branding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-1 px-3">
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Saved Successfully
            </Badge>
          )}
          <Button onClick={handleSave} className="cursor-pointer">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 Cols: Form Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Company Profile & Branding
              </CardTitle>
              <CardDescription>Legal registered business identity and logo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName">Company Registered Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">GST / Tax Identification Number</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Registered Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2 border-t space-y-3">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/20">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" /> Upload Logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Localization & Fiscal Settings
              </CardTitle>
              <CardDescription>Tax year closing, currency symbols, and default timezones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Fiscal Year Cycle</Label>
                  <Select
                    value={formData.fiscalYear}
                    onValueChange={(val) => setFormData({ ...formData, fiscalYear: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Fiscal Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan-dec">January - December</SelectItem>
                      <SelectItem value="apr-mar">April - March</SelectItem>
                      <SelectItem value="jul-jun">July - June</SelectItem>
                      <SelectItem value="oct-sep">October - September</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(val) => setFormData({ ...formData, currency: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($ - US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (£ - British Pound)</SelectItem>
                      <SelectItem value="PKR">PKR (Rs - Pakistani Rupee)</SelectItem>
                      <SelectItem value="AED">AED (Dh - UAE Dirham)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select
                    value={formData.timeZone}
                    onValueChange={(val) => setFormData({ ...formData, timeZone: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Time Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-5">EST (UTC-5)</SelectItem>
                      <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                      <SelectItem value="UTC+5">PKT (UTC+5)</SelectItem>
                      <SelectItem value="UTC+4">GST (UTC+4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Summary & Status */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" /> Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GST Status:</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fiscal Period:</span>
                <span className="font-medium">Active (Q3 2026)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tax Audit Lock:</span>
                <span className="font-medium">Dec 31, 2025</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Branch Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 border rounded-lg bg-muted/20 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Head Office (HQ)
                </div>
                <div className="text-xs text-muted-foreground">New York, NY 10001</div>
              </div>
              <div className="p-3 border rounded-lg bg-muted/20 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Operations Hub
                </div>
                <div className="text-xs text-muted-foreground">Chicago, IL 60601</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
