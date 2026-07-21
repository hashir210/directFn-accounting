import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { recordMovementSchema } from './inventory.validation';

const router = Router();

router.use(authenticate);

router.get('/', InventoryController.list);
router.post('/', validate(recordMovementSchema), InventoryController.recordMovement);

export default router;
