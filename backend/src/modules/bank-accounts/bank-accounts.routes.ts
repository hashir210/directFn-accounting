import { Router } from 'express';
import { BankAccountsController } from './bank-accounts.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { 
  createBankAccountSchema, 
  updateBankAccountSchema, 
  bankAccountIdParamSchema 
} from './bank-accounts.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('accounting.view'), BankAccountsController.getAll);
router.get('/:id', requirePermission('accounting.view'), validate(bankAccountIdParamSchema), BankAccountsController.getOne);
router.post('/', requirePermission('accounting.edit'), validate(createBankAccountSchema), BankAccountsController.create);
router.patch('/:id', requirePermission('accounting.edit'), validate(bankAccountIdParamSchema), validate(updateBankAccountSchema), BankAccountsController.update);
router.delete('/:id', requirePermission('accounting.delete'), validate(bankAccountIdParamSchema), BankAccountsController.delete);

export default router;
