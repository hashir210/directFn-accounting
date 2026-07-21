import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './products.validation';

const router = Router();

router.use(authenticate);

router.get('/', ProductsController.list);
router.post('/', validate(createProductSchema), ProductsController.create);
router.get('/:id', ProductsController.getById);
router.patch('/:id', validate(updateProductSchema), ProductsController.update);
router.delete('/:id', ProductsController.delete);

export default router;
