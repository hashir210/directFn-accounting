import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from './customers.validation';

const router = Router();

router.use(authenticate);

router.get('/', CustomersController.list);
router.post('/', validate(createCustomerSchema), CustomersController.create);
router.get('/:id', CustomersController.getById);
router.get('/:id/statement', CustomersController.getStatement);
router.patch('/:id', validate(updateCustomerSchema), CustomersController.update);
router.delete('/:id', CustomersController.delete);

export default router;

