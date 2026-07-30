import { Request, Response, NextFunction } from 'express';
import { SalesOrdersService } from './sales-orders.service';

export class SalesOrdersController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status } = req.query;
      const result = await SalesOrdersService.list(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        status: status as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesOrdersService.getById(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesOrdersService.create(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesOrdersService.update(req.user!.organizationId, req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesOrdersService.delete(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesOrdersService.confirm(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async generateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesOrdersService.generateInvoice(req.user!.organizationId, req.params.id, req.body.dueDate);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await SalesOrdersService.listInvoices(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async payInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SalesOrdersService.payInvoice(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
