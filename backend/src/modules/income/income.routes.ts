import { Router } from 'express';
import { IncomeController } from './income.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import {
  createIncomeSchema,
  updateIncomeSchema,
  incomeIdParamSchema,
} from './income.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('income.view', { screenKey: 'income' }), IncomeController.list);
router.post('/', requirePermission('income.create', { screenKey: 'income' }), validate(createIncomeSchema), IncomeController.create);
router.get('/:id', requirePermission('income.view', { screenKey: 'income' }), validate(incomeIdParamSchema), IncomeController.getById);
router.patch('/:id', requirePermission('income.update', { screenKey: 'income' }), validate(incomeIdParamSchema), validate(updateIncomeSchema), IncomeController.update);
router.delete('/:id', requirePermission('income.delete', { screenKey: 'income' }), validate(incomeIdParamSchema), IncomeController.delete);

export default router;
