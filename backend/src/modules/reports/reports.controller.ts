import { Request, Response } from 'express';
import { ReportsService } from './reports.service';

export class ReportsController {
  static async getProfitLoss(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportsService.getProfitLoss(
        req.user!.organizationId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getSalesReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportsService.getSalesReport(
        req.user!.organizationId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getExpenseReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportsService.getExpenseReport(
        req.user!.organizationId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
