import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { BadRequestError } from '../../utils/errors';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
        throw new BadRequestError('Invalid year parameter');
      }
      const data = await DashboardService.getSummary(year);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getBankBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getBankBalance();
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getPendingPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
      const data = await DashboardService.getPendingPayments(page, limit);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getMonthlySales(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const data = await DashboardService.getMonthlySales(year);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getMonthlyExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const data = await DashboardService.getMonthlyExpenses(year);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getTopCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '5', 10)));
      const data = await DashboardService.getTopCustomers(limit);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getLowStockProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const threshold = req.query.threshold
        ? parseInt(req.query.threshold as string, 10)
        : undefined;
      const data = await DashboardService.getLowStockProducts(threshold);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
      const data = await DashboardService.getNotifications(userId, page, limit);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = await DashboardService.markNotificationRead(id, userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}
