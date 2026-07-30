import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class BankAccountsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const accounts = await prisma.bankAccount.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const account = await prisma.bankAccount.findFirst({
        where: { id, organizationId },
      });
      if (!account) {
        throw new NotFoundError('Bank account not found');
      }
      res.json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const data = req.body;

      const existing = await prisma.bankAccount.findUnique({
        where: { accountNumber: data.accountNumber },
      });
      if (existing) {
        throw new BadRequestError('A bank account with this number already exists');
      }

      const account = await prisma.bankAccount.create({
        data: {
          ...data,
          organizationId,
        },
      });

      res.status(201).json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const data = req.body;

      const existing = await prisma.bankAccount.findFirst({
        where: { id, organizationId },
      });
      if (!existing) {
        throw new NotFoundError('Bank account not found');
      }

      if (data.accountNumber && data.accountNumber !== existing.accountNumber) {
        const dup = await prisma.bankAccount.findUnique({
          where: { accountNumber: data.accountNumber },
        });
        if (dup) {
          throw new BadRequestError('A bank account with this number already exists');
        }
      }

      const account = await prisma.bankAccount.update({
        where: { id },
        data,
      });

      res.json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const existing = await prisma.bankAccount.findFirst({
        where: { id, organizationId },
        include: { payments: true },
      });
      if (!existing) {
        throw new NotFoundError('Bank account not found');
      }

      if (existing.payments.length > 0) {
        throw new BadRequestError('Cannot delete bank account with linked payments');
      }

      await prisma.bankAccount.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Bank account deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
