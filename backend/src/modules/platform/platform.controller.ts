import { Request, Response, NextFunction } from 'express';
import { PlatformService } from './platform.service';

export class PlatformController {
  static async listOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
      const orgs = await PlatformService.listOrganizations();
      res.status(200).json({ success: true, data: orgs });
    } catch (error) {
      next(error);
    }
  }

  static async getOrganizationScreens(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PlatformService.getOrganizationScreens(id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganizationScreens(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { disabledScreens } = req.body;
      const data = await PlatformService.updateOrganizationScreens(
        id,
        Array.isArray(disabledScreens) ? disabledScreens : []
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await PlatformService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async createOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgName, ownerName, ownerEmail, password, planId, contactEmail, maxUsers } = req.body;
      const data = await PlatformService.createB2bOrganization({
        orgName,
        ownerName,
        ownerEmail,
        password,
        planId,
        contactEmail,
        maxUsers,
      });
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganizationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await PlatformService.updateOrganizationStatus(id, status);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganizationLimits(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { maxUsers, contactEmail, planId } = req.body;
      const data = await PlatformService.updateOrganizationLimits(id, { maxUsers, contactEmail, planId });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrganizationSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PlatformService.updateOrganizationSettings(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
