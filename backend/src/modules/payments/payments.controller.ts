import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { z } from 'zod';

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['Cash', 'Bank', 'Card', 'Online']),
  type: z.enum(['Inbound', 'Outbound']),
  status: z.enum(['Completed', 'Pending', 'Failed']).default('Completed'),
  referenceType: z.enum(['Invoice', 'PurchaseBill', 'Manual']).optional(),
  referenceId: z.string().optional(),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['Completed', 'Pending', 'Failed']),
});

export class PaymentsController {
  static async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const payments = await PaymentsService.listPayments(organizationId);
      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  static async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const payment = await PaymentsService.getPayment(organizationId, req.params.id);
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  static async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const data = createPaymentSchema.parse(req.body);
      const payment = await PaymentsService.createPayment(organizationId, data);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  static async updatePaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const data = updateStatusSchema.parse(req.body);
      const payment = await PaymentsService.updatePaymentStatus(organizationId, req.params.id, data.status);
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  static async deletePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await PaymentsService.deletePayment(organizationId, req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}
