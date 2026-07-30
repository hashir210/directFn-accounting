import { Request, Response, NextFunction } from 'express';
import { DiscountsService } from './discounts.service';

export class DiscountsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await DiscountsService.list(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DiscountsService.getById(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DiscountsService.create(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DiscountsService.update(req.user!.organizationId, req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DiscountsService.delete(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DiscountsService.validate(req.user!.organizationId, req.body.discountId, req.body.orderAmount);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
