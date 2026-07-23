import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';

export class InventoryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, type } = req.query;
      const result = await InventoryService.list(req.user!.organizationId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        type: type as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async recordMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.recordMovement(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.updateMovement(req.user!.organizationId, req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.deleteMovement(req.user!.organizationId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.listWarehouses(req.user!.organizationId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.createWarehouse(req.user!.organizationId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

