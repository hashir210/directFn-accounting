import { Router } from 'express';
import { InvoicesController } from './invoices.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceIdParamSchema,
  payInvoiceSchema,
} from './invoices.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('invoices.view'), InvoicesController.list);
router.post('/', requirePermission('invoices.edit'), validate(createInvoiceSchema), InvoicesController.create);
router.get('/:id', requirePermission('invoices.view'), validate(invoiceIdParamSchema), InvoicesController.getById);
router.patch('/:id', requirePermission('invoices.edit'), validate(invoiceIdParamSchema), validate(updateInvoiceSchema), InvoicesController.update);
router.delete('/:id', requirePermission('invoices.edit'), validate(invoiceIdParamSchema), InvoicesController.delete);
router.post('/:id/pay', requirePermission('invoices.edit'), validate(payInvoiceSchema), InvoicesController.recordPayment);

export default router;
