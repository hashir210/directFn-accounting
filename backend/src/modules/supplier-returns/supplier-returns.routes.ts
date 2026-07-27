import { Router } from 'express';
import { SupplierReturnsController } from './supplier-returns.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createSupplierReturnSchema, processSupplierReturnSchema } from './supplier-returns.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('purchases.view'), SupplierReturnsController.list);
router.post('/', requirePermission('purchases.edit'), validate(createSupplierReturnSchema), SupplierReturnsController.create);
router.get('/:id', requirePermission('purchases.view'), SupplierReturnsController.getById);
router.patch('/:id/process', requirePermission('purchases.edit'), validate(processSupplierReturnSchema), SupplierReturnsController.process);

export default router;
