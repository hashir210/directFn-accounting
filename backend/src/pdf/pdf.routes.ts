import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { generateInvoicePDF } from './invoice';
import { generateReportPDF, ReportType, closeBrowser } from './report';

const router = Router();

router.use(authenticate);

router.get(
  '/invoice/:id/pdf',
  requirePermission('invoices.view'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId },
        include: {
          customer: true,
          items: true,
          organization: true,
        },
      });

      if (!invoice) throw new NotFoundError('Invoice not found');

      const invoiceData = {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: Number(invoice.amount.toString()),
        subTotal: Number((invoice.subTotal || invoice.amount).toString()),
        taxTotal: Number((invoice.taxTotal || 0).toString()),
        discountTotal: Number((invoice.discountTotal || 0).toString()),
        status: invoice.status,
        issuedAt: invoice.issuedAt.toISOString().split('T')[0],
        dueAt: invoice.dueAt.toISOString().split('T')[0],
        paidAt: invoice.paidAt ? invoice.paidAt.toISOString().split('T')[0] : null,
        notes: invoice.notes || undefined,
        terms: invoice.terms || undefined,
        organization: invoice.organization
          ? {
              name: invoice.organization.name || undefined,
              address: invoice.organization.address || undefined,
              email: invoice.organization.contactEmail || undefined,
              logoUrl: invoice.organization.logoUrl || undefined,
            }
          : undefined,
        customerName: invoice.customer?.name || undefined,
        customerEmail: invoice.customer?.email || undefined,
        customer: invoice.customer
          ? {
              name: invoice.customer.name || undefined,
              email: invoice.customer.email || undefined,
              address: invoice.customer.address || undefined,
            }
          : undefined,
        items: invoice.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice.toString()),
          taxRate: Number(i.taxRate.toString()),
          taxAmount: Number((i.taxAmount || 0).toString()),
          total: Number(i.total.toString()),
        })),
        paymentUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/pay/${invoice.id}`,
      };

      const pdfBuffer = await generateInvoicePDF(invoiceData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/report/:type/pdf',
  requirePermission('reports.view'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportType = req.params.type as ReportType;
      const { startDate, endDate } = req.query;

      const pdfBuffer = await generateReportPDF(reportType, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        token: req.headers.authorization?.replace('Bearer ', ''),
      });

      const filename = `${reportType}-report-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/browser/restart',
  async (_req: Request, res: Response) => {
    try {
      await closeBrowser();
      res.json({ success: true, message: 'Browser instance closed. Next request will launch a new one.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;