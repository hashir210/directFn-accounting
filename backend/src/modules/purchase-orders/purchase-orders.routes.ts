import { Router } from 'express';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, receiveGoodsSchema, createInvoiceFromPOSchema } from './purchase-orders.validation';

const router = Router();

router.use(authenticate);

// GRN and Purchase Invoice list endpoints (before /:id to avoid route conflict)
router.get('/goods-received', requirePermission('purchases.view'), PurchaseOrdersController.listGRN);
router.get('/invoices', requirePermission('purchases.view'), PurchaseOrdersController.listPurchaseInvoices);

router.get('/', requirePermission('purchases.view'), PurchaseOrdersController.list);
router.post('/', requirePermission('purchases.edit'), validate(createPurchaseOrderSchema), PurchaseOrdersController.create);
router.get('/:id', requirePermission('purchases.view'), PurchaseOrdersController.getById);
router.patch('/:id', requirePermission('purchases.edit'), validate(updatePurchaseOrderSchema), PurchaseOrdersController.update);
router.delete('/:id', requirePermission('purchases.edit'), PurchaseOrdersController.delete);
router.post('/:id/send', requirePermission('purchases.edit'), PurchaseOrdersController.send);
router.post('/:id/receive', requirePermission('purchases.edit'), validate(receiveGoodsSchema), PurchaseOrdersController.receiveGoods);
router.post('/:id/invoice', requirePermission('purchases.edit'), validate(createInvoiceFromPOSchema), PurchaseOrdersController.createInvoice);

export default router;
