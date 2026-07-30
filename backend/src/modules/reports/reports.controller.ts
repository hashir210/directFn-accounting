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

  static async getBalanceSheet(req: Request, res: Response) {
    try {
      const data = await ReportsService.getBalanceSheet(req.user!.organizationId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getCashFlow(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportsService.getCashFlow(req.user!.organizationId, startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getIncomeReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportsService.getIncomeReport(req.user!.organizationId, startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPurchaseReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportsService.getPurchaseReport(req.user!.organizationId, startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getCustomerStatementReport(req: Request, res: Response) {
    try {
      const data = await ReportsService.getCustomerStatementReport(req.user!.organizationId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getSupplierStatementReport(req: Request, res: Response) {
    try {
      const data = await ReportsService.getSupplierStatementReport(req.user!.organizationId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getInventoryReport(req: Request, res: Response) {
    try {
      const data = await ReportsService.getInventoryReport(req.user!.organizationId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTaxReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportsService.getTaxReport(req.user!.organizationId, startDate as string, endDate as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getARAging(req: Request, res: Response) {
    try {
      const data = await ReportsService.getARAging(req.user!.organizationId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getAPAging(req: Request, res: Response) {
    try {
      const data = await ReportsService.getAPAging(req.user!.organizationId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}