import { Router } from 'express';
import { ExpensesController } from './expenses.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
} from './expenses.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('expenses.view'), ExpensesController.list);
router.post('/', requirePermission('expenses.edit'), validate(createExpenseSchema), ExpensesController.create);
router.get('/:id', requirePermission('expenses.view'), validate(expenseIdParamSchema), ExpensesController.getById);
router.patch('/:id', requirePermission('expenses.edit'), validate(expenseIdParamSchema), validate(updateExpenseSchema), ExpensesController.update);
router.delete('/:id', requirePermission('expenses.edit'), validate(expenseIdParamSchema), ExpensesController.delete);

export default router;
