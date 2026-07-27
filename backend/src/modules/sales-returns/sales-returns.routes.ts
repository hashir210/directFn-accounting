import { Router } from 'express';
import { SalesReturnsController } from './sales-returns.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createSalesReturnSchema, processReturnSchema } from './sales-returns.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('sales.view'), SalesReturnsController.list);
router.post('/', requirePermission('sales.edit'), validate(createSalesReturnSchema), SalesReturnsController.create);
router.get('/:id', requirePermission('sales.view'), SalesReturnsController.getById);
router.patch('/:id/process', requirePermission('sales.edit'), validate(processReturnSchema), SalesReturnsController.process);

export default router;
