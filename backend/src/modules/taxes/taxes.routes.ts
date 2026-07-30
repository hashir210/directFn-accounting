import { Router } from 'express';
import { TaxesController } from './taxes.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { 
  createTaxSchema, 
  updateTaxSchema, 
  taxIdParamSchema 
} from './taxes.validation';

const router = Router();

router.use(authenticate);

router.get('/', TaxesController.getAll);
router.post('/', requirePermission('settings.edit', { screenKey: 'settings' }), validate(createTaxSchema), TaxesController.create);
router.patch('/:id', requirePermission('settings.edit', { screenKey: 'settings' }), validate(taxIdParamSchema), validate(updateTaxSchema), TaxesController.update);
router.delete('/:id', requirePermission('settings.edit', { screenKey: 'settings' }), validate(taxIdParamSchema), TaxesController.delete);

export default router;
