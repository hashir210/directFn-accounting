import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';

export class ReportsController {
  static async getIncomeStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const result = await ReportsService.getIncomeStatement(req.user!.organizationId, year);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getBalanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReportsService.getBalanceSheet(req.user!.organizationId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCashFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const result = await ReportsService.getCashFlow(req.user!.organizationId, year);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
