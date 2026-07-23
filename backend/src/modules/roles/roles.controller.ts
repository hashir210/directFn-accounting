import { Request, Response, NextFunction } from 'express';
import { RolesService } from './roles.service';

export class RolesController {
  static async listRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const targetOrgId = req.query.orgId as string | undefined;
      const isPlatformAdmin = !!req.user!.isPlatformOrg;
      const roles = await RolesService.listRoles(req.user!.organizationId, targetOrgId, isPlatformAdmin);
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  static async listPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await RolesService.listPermissions();
      res.status(200).json({ success: true, data: permissions });
    } catch (error) {
      next(error);
    }
  }

  static async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await RolesService.getRolePermissions(req.params.id, req.user!.organizationId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async setRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionIds } = req.body;
      const data = await RolesService.setRolePermissions(
        req.params.id,
        Array.isArray(permissionIds) ? permissionIds : [],
        req.user!.organizationId
      );
      res.status(200).json({ success: true, message: 'Role permissions updated', data });
    } catch (error) {
      next(error);
    }
  }

  static async assignPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId } = req.body;
      const result = await RolesService.assignPermission(req.params.id, permissionId, req.user!.organizationId);
      res.status(200).json({ success: true, message: 'Permission assigned', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async removePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RolesService.removePermission(req.params.id, req.params.permissionId, req.user!.organizationId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}
