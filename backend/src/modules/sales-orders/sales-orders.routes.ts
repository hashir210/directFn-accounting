import { Router } from 'express';
import { SalesOrdersController } from './sales-orders.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createSalesOrderSchema, updateSalesOrderSchema, confirmOrderSchema, invoiceOrderSchema } from './sales-orders.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('sales.view'), SalesOrdersController.list);
router.get('/invoices', requirePermission('sales.view'), SalesOrdersController.listInvoices);
router.post('/', requirePermission('sales.edit'), validate(createSalesOrderSchema), SalesOrdersController.create);
router.get('/:id', requirePermission('sales.view'), SalesOrdersController.getById);
router.patch('/:id', requirePermission('sales.edit'), validate(updateSalesOrderSchema), SalesOrdersController.update);
router.delete('/:id', requirePermission('sales.edit'), SalesOrdersController.delete);
router.post('/:id/confirm', requirePermission('sales.edit'), validate(confirmOrderSchema), SalesOrdersController.confirm);
router.post('/:id/invoice', requirePermission('sales.edit'), validate(invoiceOrderSchema), SalesOrdersController.generateInvoice);
router.post('/:id/pay', requirePermission('sales.edit'), SalesOrdersController.payInvoice);

export default router;
