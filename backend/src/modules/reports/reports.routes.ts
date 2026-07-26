import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { ReportsController } from './reports.controller';

const router = Router();

router.use(authenticate);

router.get('/profit-loss', requirePermission('reports.view'), ReportsController.getProfitLoss);
router.get('/sales', requirePermission('reports.view'), ReportsController.getSalesReport);
router.get('/expenses', requirePermission('reports.view'), ReportsController.getExpenseReport);
router.get('/balance-sheet', requirePermission('reports.view'), ReportsController.getBalanceSheet);
router.get('/cash-flow', requirePermission('reports.view'), ReportsController.getCashFlow);
router.get('/income', requirePermission('reports.view'), ReportsController.getIncomeReport);
router.get('/purchases', requirePermission('reports.view'), ReportsController.getPurchaseReport);
router.get('/customer-statement', requirePermission('reports.view'), ReportsController.getCustomerStatementReport);
router.get('/supplier-statement', requirePermission('reports.view'), ReportsController.getSupplierStatementReport);
router.get('/inventory', requirePermission('reports.view'), ReportsController.getInventoryReport);
router.get('/tax', requirePermission('reports.view'), ReportsController.getTaxReport);

export default router;