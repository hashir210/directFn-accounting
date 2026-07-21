import { Request, Response, NextFunction } from 'express';
import { PlansService } from './plans.service';

export class PlansController {
  static async listPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await PlansService.listPlans();
      res.status(200).json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  }

  static async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      const plan = await PlansService.createPlan({ name, description });
      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      const plan = await PlansService.updatePlan(req.params.id, { name, description });
      res.status(200).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  }

  static async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PlansService.deletePlan(req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  static async getPlanFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const features = await PlansService.getPlanFeatures(req.params.id);
      res.status(200).json({ success: true, data: features });
    } catch (error) {
      next(error);
    }
  }

  static async setPlanFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const { features } = req.body;
      const updatedFeatures = await PlansService.setPlanFeatures(req.params.id, features || []);
      res.status(200).json({ success: true, data: updatedFeatures });
    } catch (error) {
      next(error);
    }
  }
}
