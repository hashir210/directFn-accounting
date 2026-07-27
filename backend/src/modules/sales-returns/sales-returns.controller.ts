import { Request, Response, NextFunction } from 'express';
import { SalesReturnsService } from './sales-returns.service';

export class SalesReturnsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query;
      const result = await SalesReturnsService.list(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesReturnsService.getById(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesReturnsService.create(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async process(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesReturnsService.process(req.user!.organizationId, req.params.id, req.body.action);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
