import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class TaxesController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const taxes = await prisma.tax.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: taxes });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { name, rate, isActive } = req.body;

      const existing = await prisma.tax.findUnique({
        where: { organizationId_name: { organizationId, name } },
      });
      if (existing) {
        throw new BadRequestError('Tax already exists');
      }

      const tax = await prisma.tax.create({
        data: { name, rate, isActive, organizationId },
      });

      res.status(201).json({ success: true, data: tax });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const { name, rate, isActive } = req.body;

      const existing = await prisma.tax.findFirst({
        where: { id, organizationId },
      });
      if (!existing) {
        throw new NotFoundError('Tax not found');
      }

      if (name && name !== existing.name) {
        const dup = await prisma.tax.findUnique({
          where: { organizationId_name: { organizationId, name } },
        });
        if (dup) {
          throw new BadRequestError('Tax already exists');
        }
      }

      const tax = await prisma.tax.update({
        where: { id },
        data: { name, rate, isActive },
      });

      res.json({ success: true, data: tax });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const existing = await prisma.tax.findFirst({
        where: { id, organizationId },
      });
      if (!existing) {
        throw new NotFoundError('Tax not found');
      }

      await prisma.tax.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Tax deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
