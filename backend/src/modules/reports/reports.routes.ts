import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { ReportsController } from './reports.controller';

const router = Router();

router.use(authenticate);

router.get('/profit-loss', requirePermission('reports.view'), ReportsController.getProfitLoss);
router.get('/sales', requirePermission('reports.view'), ReportsController.getSalesReport);
router.get('/expenses', requirePermission('reports.view'), ReportsController.getExpenseReport);

export default router;
