import { Request, Response, NextFunction } from 'express';
import { AccountsService } from './accounts.service';

export class AccountsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, activeOnly } = req.query;
      const result = await AccountsService.list(req.user!.organizationId, {
        type: type as string,
        activeOnly: activeOnly === 'true',
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccountsService.getById(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccountsService.create(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccountsService.update(req.user!.organizationId, req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccountsService.delete(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async seedDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccountsService.seedDefaultChart(req.user!.organizationId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
