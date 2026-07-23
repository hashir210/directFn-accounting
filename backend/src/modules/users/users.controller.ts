import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

export class UsersController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const targetOrgId = req.query.orgId as string | undefined;
      const isPlatformAdmin = !!req.user!.isPlatformOrg;
      const users = await UsersService.listUsers(req.user!.organizationId, targetOrgId, isPlatformAdmin);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async inviteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const isPlatformAdmin = !!req.user!.isPlatformOrg;
      const result = await UsersService.inviteUser(req.body, req.user!.organizationId, req.user!.id, isPlatformAdmin);
      res.status(201).json({
        success: true,
        message: 'User invited successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UsersService.updateUser(req.params.id, req.body, req.user!.organizationId, req.user!.id);
      res.status(200).json({ success: true, message: 'User updated successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UsersService.updateUserRole(req.params.id, req.body.roleId, req.user!.organizationId, req.user!.id);
      res.status(200).json({ success: true, message: 'Role updated successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async removeUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UsersService.removeUser(req.params.id, req.user!.organizationId, req.user!.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  static async getUserScreenBlocks(req: Request, res: Response, next: NextFunction) {
    try {
      const blocks = await UsersService.getUserScreenBlocks(req.params.id, req.user!.organizationId);
      res.status(200).json({ success: true, data: blocks });
    } catch (error) {
      next(error);
    }
  }

  static async setUserScreenBlocks(req: Request, res: Response, next: NextFunction) {
    try {
      const { screenKeys } = req.body;
      const blocks = await UsersService.setUserScreenBlocks(req.params.id, screenKeys || [], req.user!.organizationId);
      res.status(200).json({ success: true, data: blocks });
    } catch (error) {
      next(error);
    }
  }
}
