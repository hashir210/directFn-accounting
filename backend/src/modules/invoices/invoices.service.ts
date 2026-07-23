import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/db';
import { BadRequestError, NotFoundError } from '../../utils/errors';

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
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invoice) throw new NotFoundError('Invoice not found');

    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      customerEmail: invoice.customer.email,
      amount: toNumber(invoice.amount),
      status: invoice.status,
      issuedAt: invoice.issuedAt.toISOString().split('T')[0],
      dueAt: invoice.dueAt.toISOString().split('T')[0],
      paidAt: invoice.paidAt ? invoice.paidAt.toISOString().split('T')[0] : null,
      createdAt: invoice.createdAt,
    };
  }

  static async create(organizationId: string, data: {
    customerName: string;
    customerEmail?: string;
    amount: number;
    dueAt?: string;
    status?: string;
  }) {
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

    const invoiceCount = await prisma.invoice.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const invoiceNo = `INV-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const isPaid = data.status === 'paid';
    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        customerId: customer.id,
        invoiceNo,
        amount: new Decimal(data.amount),
        dueAt: new Date(data.dueAt || Date.now() + 14 * 86400000),
        status: data.status || 'pending',
        paidAt: isPaid ? new Date() : null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customer.name,
      customerEmail: invoice.customer.email,
      amount: toNumber(invoice.amount),
      status: invoice.status,
      issuedAt: invoice.issuedAt.toISOString().split('T')[0],
      dueAt: invoice.dueAt.toISOString().split('T')[0],
    };
  }

  static async update(organizationId: string, id: string, data: {
    customerName?: string;
    customerEmail?: string;
    amount?: number;
    dueAt?: string;
    status?: string;
  }) {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundError('Invoice not found');

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
    if (data.dueAt !== undefined) updateData.dueAt = new Date(data.dueAt);
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'paid' && !existing.paidAt) {
        updateData.paidAt = new Date();
      } else if (data.status !== 'paid') {
        updateData.paidAt = null;
      }
    }

    if (data.customerName !== undefined || data.customerEmail !== undefined) {
      const customer = await prisma.customer.findFirst({
        where: { organizationId, name: existing.customerId },
      });
      if (customer) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            ...(data.customerName && { name: data.customerName }),
            ...(data.customerEmail && { email: data.customerEmail }),
          },
        });
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customer.name,
      customerEmail: invoice.customer.email,
      amount: toNumber(invoice.amount),
      status: invoice.status,
      issuedAt: invoice.issuedAt.toISOString().split('T')[0],
      dueAt: invoice.dueAt.toISOString().split('T')[0],
      paidAt: invoice.paidAt ? invoice.paidAt.toISOString().split('T')[0] : null,
    };
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
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: updated.id,
      invoiceNo: updated.invoiceNo,
      customerName: updated.customer.name,
      amount: toNumber(updated.amount),
      status: updated.status,
      paidAt: updated.paidAt?.toISOString().split('T')[0],
    };
  }
}
