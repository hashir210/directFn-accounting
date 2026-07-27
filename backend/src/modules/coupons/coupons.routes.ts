import { Router } from 'express';
import { CouponsController } from './coupons.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from './coupons.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('sales.view'), CouponsController.list);
router.post('/', requirePermission('sales.edit'), validate(createCouponSchema), CouponsController.create);
router.post('/validate', requirePermission('sales.view'), validate(validateCouponSchema), CouponsController.validate);
router.get('/:id', requirePermission('sales.view'), CouponsController.getById);
router.patch('/:id', requirePermission('sales.edit'), validate(updateCouponSchema), CouponsController.update);
router.delete('/:id', requirePermission('sales.edit'), CouponsController.delete);

export default router;
