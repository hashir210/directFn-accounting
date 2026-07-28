'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Download, Mail, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import apiFetch from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

// Using require for html2pdf to avoid type errors if types aren't installed
const getHtml2Pdf = async () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return (await import('html2pdf.js')).default;
  }
  return null;
};

export default function InvoiceViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const [serverPdfLoading, setServerPdfLoading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await apiFetch(`/api/v1/invoices/${id}`);
        setInvoice(res);
      } catch (err) {
        console.error('Failed to load invoice', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    try {
      const html2pdf = await getHtml2Pdf();
      if (!html2pdf) {
        alert('PDF library not available. Try the "Server PDF" button instead.');
        return;
      }

      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `${invoice.invoiceNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(invoiceRef.current).save();
    } catch (err: any) {
      alert(err?.message || 'Failed to generate PDF. Try the "Server PDF" button instead.');
    }
  };

  const handleServerPdfDownload = async () => {
    setServerPdfLoading(true);
    try {
      const token = localStorage.getItem('ff_access_token');
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const res = await fetch(`${API_URL}/api/v1/pdf/invoice/${id}/pdf`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status}: ${errorBody || 'Failed to generate PDF'}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to generate server PDF');
    } finally {
      setServerPdfLoading(false);
    }
  };

  const handleEmail = async () => {
    setEmailing(true);
    try {
      const res = await apiFetch(`/api/v1/invoices/${id}/email`, { method: 'POST', body: JSON.stringify({}) });
      if (res) alert('Invoice emailed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to email invoice');
    } finally {
      setEmailing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!invoice) return <div className="p-8 text-center text-muted-foreground">Invoice not found.</div>;

  const paymentUrl = typeof window !== 'undefined' ? `${window.location.origin}/pay/${invoice.id}` : `https://example.com/pay/${invoice.id}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:p-0 print:m-0 print:block">
      {/* Non-printable Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices
        </Button>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
          <Button variant="outline" onClick={handleServerPdfDownload} disabled={serverPdfLoading}>
            {serverPdfLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {serverPdfLoading ? 'Generating...' : 'Server PDF'}
          </Button>
          <Button onClick={handleEmail} disabled={emailing} className="bg-primary hover:bg-primary-tint text-primary-foreground">
            {emailing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Email to Customer
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <Card className="border-border/50 shadow-lg overflow-hidden bg-white text-black print:shadow-none print:border-none" ref={invoiceRef}>
        <CardContent className="p-12 print:p-0">
          <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Invoice</h1>
              <p className="text-gray-500 mt-1 font-medium">{invoice.invoiceNo}</p>
            </div>
            <div className="text-right">
              {invoice.organization?.logoUrl ? (
                <img src={invoice.organization.logoUrl} alt="Logo" className="h-12 w-auto mb-4 object-contain inline-block" />
              ) : (
                <div className="h-12 text-2xl font-bold text-gray-900 flex items-center justify-end">{invoice.organization?.name || 'DirectFN'}</div>
              )}
              <div className="text-sm text-gray-500 mt-2">
                <p>{invoice.organization?.address || 'DirectFN Headquarters, Dubai'}</p>
                <p>{invoice.organization?.email || 'billing@directfn.com'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-8">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Billed To</h3>
              <p className="text-lg font-bold text-gray-900">{invoice.customerName}</p>
              <p className="text-gray-600 mt-1">{invoice.customerEmail}</p>
              <p className="text-gray-600">{invoice.customer?.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-right">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issue Date</h3>
                <p className="text-gray-900 font-medium">{invoice.issuedAt}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Due Date</h3>
                <p className="text-gray-900 font-medium">{invoice.dueAt}</p>
              </div>
              <div className="col-span-2 mt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</h3>
                <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'warning'} className="text-sm px-3 py-1">
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-3 font-bold text-gray-900">Description</th>
                <th className="py-3 font-bold text-gray-900 text-right">Qty</th>
                <th className="py-3 font-bold text-gray-900 text-right">Price</th>
                <th className="py-3 font-bold text-gray-900 text-right">Tax</th>
                <th className="py-3 font-bold text-gray-900 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-4 text-gray-900">{item.description}</td>
                  <td className="py-4 text-gray-600 text-right">{item.quantity}</td>
                  <td className="py-4 text-gray-600 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-4 text-gray-600 text-right">{item.taxRate}%</td>
                  <td className="py-4 text-gray-900 font-medium text-right">${item.total.toFixed(2)}</td>
                </tr>
              ))}
              {(!invoice.items || invoice.items.length === 0) && (
                <tr className="border-b border-gray-200">
                  <td className="py-4 text-gray-900">General Service</td>
                  <td className="py-4 text-gray-600 text-right">1</td>
                  <td className="py-4 text-gray-600 text-right">${invoice.amount.toFixed(2)}</td>
                  <td className="py-4 text-gray-600 text-right">0%</td>
                  <td className="py-4 text-gray-900 font-medium text-right">${invoice.amount.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-start">
            <div className="w-1/2 pr-8">
              {invoice.notes && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-gray-600 text-sm">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Terms</h3>
                  <p className="text-gray-600 text-sm">{invoice.terms}</p>
                </div>
              )}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Scan to Pay</h3>
                <div className="p-2 bg-gray-50 rounded-lg inline-block">
                  <QRCodeSVG value={paymentUrl} size={100} />
                </div>
              </div>
            </div>
            
            <div className="w-1/2 max-w-sm ml-auto space-y-4 text-right">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${(invoice.subTotal || invoice.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${(invoice.taxTotal || 0).toFixed(2)}</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span>-${invoice.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-900 text-xl font-bold border-t-2 border-gray-900 pt-4">
                <span>Total Due</span>
                <span>${invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
