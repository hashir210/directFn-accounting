import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import nodemailer from 'nodemailer';
import eventEmitter, { EventTypes } from '../../utils/events';

function toNumber(d: Decimal | null | undefined): number {
  return d ? Number(d.toString()) : 0;
}

export class InvoicesService {
  static async list(organizationId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPlatform: true } });
    const where: any = org?.isPlatform ? {} : { organizationId };
    if (options.status && options.status !== 'all') {
      where.status = options.status;
    }
    if (options.search) {
      where.OR = [
        { invoiceNo: { contains: options.search } },
        { customer: { name: { contains: options.search } } },
        { customer: { email: { contains: options.search } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        customerId: inv.customerId,
        customerName: inv.customer.name,
        customerEmail: inv.customer.email,
        amount: toNumber(inv.amount),
        status: inv.status,
        issuedAt: inv.issuedAt.toISOString().split('T')[0],
        dueAt: inv.dueAt.toISOString().split('T')[0],
        paidAt: inv.paidAt ? inv.paidAt.toISOString().split('T')[0] : null,
        createdAt: inv.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(organizationId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        items: true,
        organization: true, // For rendering company details on the invoice
      },
    });

    if (!invoice) throw new NotFoundError('Invoice not found');

    return {
      ...invoice,
      amount: toNumber(invoice.amount),
      subTotal: toNumber(invoice.subTotal),
      taxTotal: toNumber(invoice.taxTotal),
      discountTotal: toNumber(invoice.discountTotal),
      issuedAt: invoice.issuedAt.toISOString().split('T')[0],
      dueAt: invoice.dueAt.toISOString().split('T')[0],
      paidAt: invoice.paidAt ? invoice.paidAt.toISOString().split('T')[0] : null,
      items: invoice.items.map((i) => ({
        ...i,
        unitPrice: toNumber(i.unitPrice),
        taxRate: toNumber(i.taxRate),
        taxAmount: toNumber(i.taxAmount),
        total: toNumber(i.total),
      })),
    };
  }

  static async create(organizationId: string, data: {
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    status?: string;
    dueAt?: string;
    notes?: string;
    terms?: string;
    items: Array<{
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>;
  }) {
    let customerId = data.customerId;

    if (!customerId && data.customerName) {
      let customer = await prisma.customer.findFirst({
        where: { organizationId, name: data.customerName },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            organizationId,
            name: data.customerName,
            email: data.customerEmail || `${data.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          },
        });
      }
      customerId = customer.id;
    }

    if (!customerId) throw new BadRequestError('Customer is required');

    // Generate Invoice Number
    const invoiceCount = await prisma.invoice.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const invoiceNo = `INV-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Calculate totals server-side
    let subTotal = 0;
    let taxTotal = 0;
    const discountTotal = 0; // Can be added later if needed

    const invoiceItems = data.items.map(item => {
      const lineSubTotal = item.quantity * item.unitPrice;
      const lineTax = lineSubTotal * (item.taxRate / 100);
      const lineTotal = lineSubTotal + lineTax;

      subTotal += lineSubTotal;
      taxTotal += lineTax;

      return {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: new Decimal(item.unitPrice),
        taxRate: new Decimal(item.taxRate),
        taxAmount: new Decimal(lineTax),
        total: new Decimal(lineTotal),
      };
    });

    const amount = subTotal + taxTotal - discountTotal;
    const isPaid = data.status === 'paid';

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        customerId,
        invoiceNo,
        amount: new Decimal(amount),
        subTotal: new Decimal(subTotal),
        taxTotal: new Decimal(taxTotal),
        discountTotal: new Decimal(discountTotal),
        notes: data.notes,
        terms: data.terms,
        dueAt: new Date(data.dueAt || Date.now() + 14 * 86400000),
        status: data.status || 'pending',
        paidAt: isPaid ? new Date() : null,
        items: {
          create: invoiceItems
        }
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return invoice;
  }

  static async update(organizationId: string, id: string, data: any) {
    // For simplicity, we just allow updating status/notes via generic update for now
    // Updating line items usually involves deleting old ones and re-creating
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundError('Invoice not found');

    const updateData: any = {};
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'paid' && !existing.paidAt) {
        updateData.paidAt = new Date();
      } else if (data.status !== 'paid') {
        updateData.paidAt = null;
      }
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.terms !== undefined) updateData.terms = data.terms;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    if (data.status === 'paid' && existing.status !== 'paid') {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (org) {
        eventEmitter.emit(EventTypes.INVOICE_PAID, {
          organizationId: invoice.organizationId,
          userId: org.ownerId,
          invoiceNo: invoice.invoiceNo,
          amount: invoice.amount.toString(),
          invoiceId: invoice.id,
        });
      }
    }

    return invoice;
  }

  static async delete(organizationId: string, id: string) {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundError('Invoice not found');

    await prisma.invoice.delete({ where: { id } });
    return { message: 'Invoice deleted successfully' };
  }

  static async recordPayment(organizationId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.status === 'paid') throw new BadRequestError('Invoice is already paid');

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    });

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (org) {
      eventEmitter.emit(EventTypes.INVOICE_PAID, {
        organizationId: updated.organizationId,
        userId: org.ownerId,
        invoiceNo: updated.invoiceNo,
        amount: updated.amount.toString(),
        invoiceId: updated.id,
      });
    }

    return updated;
  }

  static async emailInvoice(organizationId: string, id: string, email?: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { customer: true, organization: true },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');

    const targetEmail = email || invoice.customer.email;
    if (!targetEmail) throw new BadRequestError('Customer email not found');

    // Simulate sending email (in a real app, use nodemailer with actual SMTP config)
    console.log(`Simulating sending invoice ${invoice.invoiceNo} to ${targetEmail}`);
    
    // We would use nodemailer here:
    /*
    const transporter = nodemailer.createTransport({ ... });
    await transporter.sendMail({
      from: 'noreply@finflow.com',
      to: targetEmail,
      subject: `Invoice ${invoice.invoiceNo} from ${invoice.organization.name}`,
      text: `Please find your invoice attached or visit .../invoices/${invoice.id}`,
    });
    */

    return { message: 'Invoice emailed successfully', email: targetEmail };
  }
}
