import { Request, Response, NextFunction } from 'express';
import { ArchiveService } from './archive.service';
import { BadRequestError } from '../../utils/errors';

export class ArchiveController {
  static async getArchives(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const data = await ArchiveService.getArchives(orgId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { year, totalRevenue, totalExpenses, netMargin, growth, auditStatus } = req.body;

      if (!year || totalRevenue === undefined || totalExpenses === undefined || netMargin === undefined) {
        throw new BadRequestError('Year, totalRevenue, totalExpenses, and netMargin are required');
      }

      const data = await ArchiveService.createArchive(orgId, {
        year,
        totalRevenue: parseFloat(totalRevenue),
        totalExpenses: parseFloat(totalExpenses),
        netMargin: parseFloat(netMargin),
        growth,
        auditStatus
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
