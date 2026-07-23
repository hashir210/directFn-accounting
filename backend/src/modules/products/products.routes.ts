import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './products.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('products.view'), ProductsController.list);
router.post('/', requirePermission('products.edit'), validate(createProductSchema), ProductsController.create);
router.get('/:id', requirePermission('products.view'), ProductsController.getById);
router.patch('/:id', requirePermission('products.edit'), validate(updateProductSchema), ProductsController.update);
router.delete('/:id', requirePermission('products.edit'), ProductsController.delete);

export default router;
