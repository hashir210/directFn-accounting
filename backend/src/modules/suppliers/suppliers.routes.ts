import { Router } from 'express';
import { SuppliersController } from './suppliers.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.validation';

const router = Router();

router.use(authenticate);

router.get('/', SuppliersController.list);
router.post('/', validate(createSupplierSchema), SuppliersController.create);
router.post('/bills', SuppliersController.createPurchaseBill);
router.post('/payments', SuppliersController.recordPayment);
router.get('/:id', SuppliersController.getById);
router.patch('/:id', validate(updateSupplierSchema), SuppliersController.update);
router.delete('/:id', SuppliersController.delete);

export default router;

