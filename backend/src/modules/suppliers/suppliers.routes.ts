import { Router } from 'express';
import { SuppliersController } from './suppliers.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('products.view'), SuppliersController.list);
router.post('/', requirePermission('products.edit'), validate(createSupplierSchema), SuppliersController.create);
router.post('/bills', requirePermission('expenses.edit'), SuppliersController.createPurchaseBill);
router.post('/payments', requirePermission('expenses.edit'), SuppliersController.recordPayment);
router.get('/:id', requirePermission('products.view'), SuppliersController.getById);
router.patch('/:id', requirePermission('products.edit'), validate(updateSupplierSchema), SuppliersController.update);
router.delete('/:id', requirePermission('products.edit'), SuppliersController.delete);

export default router;
