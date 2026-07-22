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

  static async getCurrentOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const org = await OrganizationService.getCurrentOrg(orgId);
      res.status(200).json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { name, contactEmail, gstVatNumber, address, fiscalYear, currency, timeZone, logoUrl } = req.body;

      const updatedOrg = await OrganizationService.updateOrganization(orgId, {
        name,
        contactEmail,
        gstVatNumber,
        address,
        fiscalYear,
        currency,
        timeZone,
        logoUrl,
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

