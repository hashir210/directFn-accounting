import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { recordMovementSchema } from './inventory.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('products.view'), InventoryController.list);
router.post('/', requirePermission('products.edit'), validate(recordMovementSchema), InventoryController.recordMovement);
router.get('/warehouses', requirePermission('products.view'), InventoryController.listWarehouses);
router.post('/warehouses', requirePermission('products.edit'), InventoryController.createWarehouse);

export default router;
