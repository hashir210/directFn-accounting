import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/income-statement', ReportsController.getIncomeStatement);
router.get('/balance-sheet', ReportsController.getBalanceSheet);
router.get('/cash-flow', ReportsController.getCashFlow);

export default router;
