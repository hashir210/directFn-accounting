import { Request, Response, NextFunction } from 'express';
import { PurchaseOrdersService } from './purchase-orders.service';

export class PurchaseOrdersController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status } = req.query;
      const result = await PurchaseOrdersService.list(req.user!.organizationId, {
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
      const result = await PurchaseOrdersService.getById(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PurchaseOrdersService.create(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PurchaseOrdersService.update(req.user!.organizationId, req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PurchaseOrdersService.delete(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PurchaseOrdersService.send(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async receiveGoods(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PurchaseOrdersService.receiveGoods(req.user!.organizationId, req.params.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PurchaseOrdersService.createInvoice(req.user!.organizationId, req.params.id, req.body.dueDate);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async listGRN(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await PurchaseOrdersService.listGRN(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async listPurchaseInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query;
      const result = await PurchaseOrdersService.listPurchaseInvoices(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
