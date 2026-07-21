import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service';

export class OrganizationController {
  static async getPublicOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
      const orgs = await OrganizationService.getPublicOrganizations();
      res.status(200).json({ success: true, data: orgs });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      // Only tenant‑editable fields are accepted; platform‑controlled fields
      // (maxUsers, disabledScreens, planId, status) are ignored by the service.
      const { name, contactEmail } = req.body;

      const updatedOrg = await OrganizationService.updateOrganization(orgId, {
        name,
        contactEmail,
      });

      res.status(200).json({ success: true, data: updatedOrg });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OrganizationService.getOrganizationPlan(req.user!.organizationId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
