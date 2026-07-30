import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  categoryIdParamSchema 
} from './categories.validation';

const router = Router();

router.use(authenticate);

router.get('/', CategoriesController.getAll);
router.post('/', requirePermission('settings.edit', { screenKey: 'settings' }), validate(createCategorySchema), CategoriesController.create);
router.patch('/:id', requirePermission('settings.edit', { screenKey: 'settings' }), validate(categoryIdParamSchema), validate(updateCategorySchema), CategoriesController.update);
router.delete('/:id', requirePermission('settings.edit', { screenKey: 'settings' }), validate(categoryIdParamSchema), CategoriesController.delete);

export default router;
