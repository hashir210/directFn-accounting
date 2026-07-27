import { Request, Response, NextFunction } from 'express';
import { AccountingService } from './accounting.service';

export class AccountingController {
  static async generalLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId, from, to } = req.query;
      const result = await AccountingService.getGeneralLedger(req.user!.organizationId, {
        accountId: accountId as string,
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async trialBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      const result = await AccountingService.getTrialBalance(req.user!.organizationId, {
        from: from as string,
        to: to as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async balanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const { asOf } = req.query;
      const result = await AccountingService.getBalanceSheet(req.user!.organizationId, asOf as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async profitAndLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, year } = req.query;
      const result = await AccountingService.getProfitAndLoss(req.user!.organizationId, {
        from: from as string,
        to: to as string,
        year: year ? parseInt(year as string) : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cashFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, year } = req.query;
      const result = await AccountingService.getCashFlow(req.user!.organizationId, {
        from: from as string,
        to: to as string,
        year: year ? parseInt(year as string) : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
