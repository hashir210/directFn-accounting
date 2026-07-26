import prisma from '../../config/db';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { Prisma } from '@prisma/client';
import eventEmitter, { EventTypes } from '../../utils/events';

export class PaymentsService {
  static async listPayments(organizationId: string) {
    return prisma.payment.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        bankAccount: { select: { id: true, name: true, bankName: true } },
        invoice: { select: { id: true, invoiceNo: true, customer: { select: { name: true } } } },
        purchaseBill: { select: { id: true, billNo: true, supplier: { select: { name: true } } } },
      }
    });
  }

  static async getPayment(organizationId: string, id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        invoice: { include: { customer: true } },
        purchaseBill: { include: { supplier: true } },
      }
    });

    if (!payment || payment.organizationId !== organizationId) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  static async createPayment(organizationId: string, data: any) {
    const { amount, method, type, status, referenceType, referenceId, bankAccountId, notes } = data;

    // Validate Bank Account if provided
    if (bankAccountId) {
      const bank = await prisma.bankAccount.findUnique({
        where: { id: bankAccountId }
      });
      if (!bank || bank.organizationId !== organizationId) {
        throw new BadRequestError('Invalid bank account');
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create the payment record
      const payment = await tx.payment.create({
        data: {
          organizationId,
          amount,
          method,
          type,
          status,
          referenceType,
          referenceId,
          bankAccountId,
          notes,
        }
      });

      // 2. Update Bank Account Balance
      if (bankAccountId && status === 'Completed') {
        const adjustment = type === 'Inbound' ? amount : -amount;
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: { balance: { increment: adjustment } }
        });
      }

      // 3. Update related Invoice or PurchaseBill
      if (referenceType === 'Invoice' && referenceId && status === 'Completed') {
        const invoice = await tx.invoice.findUnique({ where: { id: referenceId } });
        if (invoice) {
          // Calculate total paid so far
          const allPayments = await tx.payment.aggregate({
            where: { referenceType: 'Invoice', referenceId, status: 'Completed', organizationId },
            _sum: { amount: true }
          });
          
          const totalPaid = new Prisma.Decimal(allPayments._sum.amount?.toString() || 0);
          
          if (totalPaid.gte(invoice.amount)) {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { status: 'paid', paidAt: new Date() }
            });
          } else {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { status: 'partially_paid' }
            });
          }
        }
      }

      eventEmitter.emit(EventTypes.AUDIT_LOG, {
        organizationId,
        action: 'CREATE',
        entity: 'PAYMENT',
        entityId: payment.id,
        details: JSON.stringify({ amount: payment.amount.toString(), method: payment.method }),
      });

      return payment;
    });
  }

  static async updatePaymentStatus(organizationId: string, id: string, status: string) {
    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment || payment.organizationId !== organizationId) {
      throw new NotFoundError('Payment not found');
    }
    
    if (payment.status === status) return payment;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: { status }
      });

      // Handle Bank Account Reversals / Apply
      if (payment.bankAccountId) {
        let adjustment = new Prisma.Decimal(0);
        
        // If it was completed and now is not, reverse the balance
        if (payment.status === 'Completed' && status !== 'Completed') {
           adjustment = payment.type === 'Inbound' ? payment.amount.mul(-1) : payment.amount;
        } 
        // If it was not completed and now is completed, apply the balance
        else if (payment.status !== 'Completed' && status === 'Completed') {
           adjustment = payment.type === 'Inbound' ? payment.amount : payment.amount.mul(-1);
        }

        if (!adjustment.equals(0)) {
          await tx.bankAccount.update({
            where: { id: payment.bankAccountId },
            data: { balance: { increment: adjustment } }
          });
        }
      }

      eventEmitter.emit(EventTypes.AUDIT_LOG, {
        organizationId,
        action: 'UPDATE',
        entity: 'PAYMENT',
        entityId: updated.id,
        details: JSON.stringify({ status: updated.status }),
      });

      return updated;
    });
  }

  static async deletePayment(organizationId: string, id: string) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.organizationId !== organizationId) {
      throw new NotFoundError('Payment not found');
    }

    return prisma.$transaction(async (tx) => {
      // Reverse bank account balance if completed
      if (payment.status === 'Completed' && payment.bankAccountId) {
        const adjustment = payment.type === 'Inbound' ? payment.amount.mul(-1) : payment.amount;
        await tx.bankAccount.update({
          where: { id: payment.bankAccountId },
          data: { balance: { increment: adjustment } }
        });
      }

      await tx.payment.delete({ where: { id } });

      eventEmitter.emit(EventTypes.AUDIT_LOG, {
        organizationId,
        action: 'DELETE',
        entity: 'PAYMENT',
        entityId: id,
        details: JSON.stringify({ amount: payment.amount.toString() }),
      });

      return { message: 'Payment deleted successfully' };
    });
  }
}
