import { Router } from 'express';
import { DiscountsController } from './discounts.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createDiscountSchema, updateDiscountSchema } from './discounts.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('sales.view'), DiscountsController.list);
router.post('/', requirePermission('sales.edit'), validate(createDiscountSchema), DiscountsController.create);
router.post('/validate', requirePermission('sales.view'), DiscountsController.validate);
router.get('/:id', requirePermission('sales.view'), DiscountsController.getById);
router.patch('/:id', requirePermission('sales.edit'), validate(updateDiscountSchema), DiscountsController.update);
router.delete('/:id', requirePermission('sales.edit'), DiscountsController.delete);

export default router;
