import { Router } from 'express';
import { AccountsController } from './accounts.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import {
  createAccountSchema,
  updateAccountSchema,
  accountIdParamSchema,
} from './accounts.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('accounting.view', { screenKey: 'accounting' }), AccountsController.list);
router.post('/seed', requirePermission('accounting.create', { screenKey: 'accounting' }), AccountsController.seedDefault);
router.post('/', requirePermission('accounting.create', { screenKey: 'accounting' }), validate(createAccountSchema), AccountsController.create);
router.get('/:id', requirePermission('accounting.view', { screenKey: 'accounting' }), validate(accountIdParamSchema), AccountsController.getById);
router.patch('/:id', requirePermission('accounting.update', { screenKey: 'accounting' }), validate(accountIdParamSchema), validate(updateAccountSchema), AccountsController.update);
router.delete('/:id', requirePermission('accounting.delete', { screenKey: 'accounting' }), validate(accountIdParamSchema), AccountsController.delete);

export default router;
