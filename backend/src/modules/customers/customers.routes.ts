import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from './customers.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('customers.view'), CustomersController.list);
router.post('/', requirePermission('customers.edit'), validate(createCustomerSchema), CustomersController.create);
router.get('/:id', requirePermission('customers.view'), CustomersController.getById);
router.get('/:id/statement', requirePermission('customers.view'), CustomersController.getStatement);
router.patch('/:id', requirePermission('customers.edit'), validate(updateCustomerSchema), CustomersController.update);
router.delete('/:id', requirePermission('customers.edit'), CustomersController.delete);

export default router;
