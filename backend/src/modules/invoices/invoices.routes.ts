import { Router } from 'express';
import { InvoicesController } from './invoices.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceIdParamSchema,
  payInvoiceSchema,
} from './invoices.validation';

const router = Router();

router.use(authenticate);

router.get('/', InvoicesController.list);
router.post('/', validate(createInvoiceSchema), InvoicesController.create);
router.get('/:id', validate(invoiceIdParamSchema), InvoicesController.getById);
router.patch('/:id', validate(invoiceIdParamSchema), validate(updateInvoiceSchema), InvoicesController.update);
router.delete('/:id', validate(invoiceIdParamSchema), InvoicesController.delete);
router.post('/:id/pay', validate(payInvoiceSchema), InvoicesController.recordPayment);

export default router;
