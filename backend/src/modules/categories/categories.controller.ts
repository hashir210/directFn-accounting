import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class CategoriesController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { type } = req.query;
      const categories = await prisma.category.findMany({
        where: { 
          organizationId,
          ...(type ? { type: String(type) } : {}) 
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { name, type } = req.body;

      const existing = await prisma.category.findUnique({
        where: { organizationId_name_type: { organizationId, name, type } },
      });
      if (existing) {
        throw new BadRequestError('Category already exists');
      }

      const category = await prisma.category.create({
        data: { name, type, organizationId },
      });

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const { name, type } = req.body;

      const existing = await prisma.category.findFirst({
        where: { id, organizationId },
      });
      if (!existing) {
        throw new NotFoundError('Category not found');
      }

      if (name || type) {
        const checkName = name || existing.name;
        const checkType = type || existing.type;
        const dup = await prisma.category.findUnique({
          where: { organizationId_name_type: { organizationId, name: checkName, type: checkType } },
        });
        if (dup && dup.id !== id) {
          throw new BadRequestError('Category already exists');
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: { name, type },
      });

      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const existing = await prisma.category.findFirst({
        where: { id, organizationId },
      });
      if (!existing) {
        throw new NotFoundError('Category not found');
      }

      await prisma.category.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
