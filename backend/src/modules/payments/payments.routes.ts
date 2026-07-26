import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('payments.view'),
  PaymentsController.listPayments
);

router.get(
  '/:id',
  requirePermission('payments.view'),
  PaymentsController.getPayment
);

router.post(
  '/',
  requirePermission('payments.create'),
  PaymentsController.createPayment
);

router.patch(
  '/:id/status',
  requirePermission('payments.edit'),
  PaymentsController.updatePaymentStatus
);

router.delete(
  '/:id',
  requirePermission('payments.delete'),
  PaymentsController.deletePayment
);

export default router;
