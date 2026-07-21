import { Request, Response, NextFunction } from 'express';
import { ExpensesService } from './expenses.service';

export class ExpensesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, category } = req.query;
      const result = await ExpensesService.list(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        category: category as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ExpensesService.getById(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ExpensesService.create(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ExpensesService.update(req.user!.organizationId, req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ExpensesService.delete(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
