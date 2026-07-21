import { Router } from 'express';
import { ExpensesController } from './expenses.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
} from './expenses.validation';

const router = Router();

router.use(authenticate);

router.get('/', ExpensesController.list);
router.post('/', validate(createExpenseSchema), ExpensesController.create);
router.get('/:id', validate(expenseIdParamSchema), ExpensesController.getById);
router.patch('/:id', validate(expenseIdParamSchema), validate(updateExpenseSchema), ExpensesController.update);
router.delete('/:id', validate(expenseIdParamSchema), ExpensesController.delete);

export default router;
