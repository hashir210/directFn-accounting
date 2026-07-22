'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  Globe,
  Upload,
  CheckCircle,
  ShieldCheck,
  MapPin,
  Loader2,
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
import { apiFetch, ApiError } from '@/lib/api';

export default function CompanyManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    taxNumber: '',
    address: '',
    fiscalYear: 'jan-dec',
    currency: 'USD',
    timeZone: 'UTC-5',
    logoUrl: '',
  });

  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await apiFetch<{
          name?: string;
          contactEmail?: string;
          gstVatNumber?: string;
          address?: string;
          fiscalYear?: string;
          currency?: string;
          timeZone?: string;
          logoUrl?: string;
        }>('/api/v1/organization/current');
        setFormData({
          companyName: data.name || '',
          contactEmail: data.contactEmail || '',
          taxNumber: data.gstVatNumber || '',
          address: data.address || '',
          fiscalYear: data.fiscalYear || 'jan-dec',
          currency: data.currency || 'USD',
          timeZone: data.timeZone || 'UTC-5',
          logoUrl: data.logoUrl || '',
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load organization settings');
      } finally {
        setIsLoading(false);
      }
    }
    loadCompany();
  }, []);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await apiFetch('/api/v1/organization/current', {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.companyName,
          contactEmail: formData.contactEmail,
          gstVatNumber: formData.taxNumber,
          address: formData.address,
          fiscalYear: formData.fiscalYear,
          currency: formData.currency,
          timeZone: formData.timeZone,
          logoUrl: formData.logoUrl,
        }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update company settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <Button onClick={handleSave} disabled={isSaving} className="cursor-pointer">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 Cols: Form Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Company Profile & Branding
              </CardTitle>
              <CardDescription>Legal registered business identity and contact details.</CardDescription>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contactEmail">Official Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="billing@company.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="taxNumber">GST / VAT Identification Number</Label>
                  <Input
                    id="taxNumber"
                    placeholder="e.g. GST-98420-DFN"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="logoUrl">Company Logo URL</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Registered Address</Label>
                  <Input
                    id="address"
                    placeholder="Address, City, Country"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
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
                <span className="text-muted-foreground">GST/VAT Status:</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fiscal Cycle:</span>
                <span className="font-medium uppercase">{formData.fiscalYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium">{formData.currency}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

