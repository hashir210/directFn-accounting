import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

const router = Router();

// All dashboard routes require a valid JWT
router.use(authenticate);

// Summary: revenue, expenses, P&L, cash flow
router.get('/summary', requirePermission('dashboard.view'), DashboardController.getSummary);

// Bank balance card
router.get('/bank-balance', requirePermission('dashboard.view'), DashboardController.getBankBalance);

// Pending payments list (paginated)
router.get('/pending-payments', requirePermission('invoices.view'), DashboardController.getPendingPayments);

// Monthly sales chart
router.get('/monthly-sales', requirePermission('dashboard.view'), DashboardController.getMonthlySales);

// Monthly expenses chart
router.get('/monthly-expenses', requirePermission('dashboard.view'), DashboardController.getMonthlyExpenses);

// Top customers — manager & admin only
router.get('/top-customers', requirePermission('customers.view'), DashboardController.getTopCustomers);

// Low stock alerts
router.get('/low-stock', requirePermission('products.view'), DashboardController.getLowStockProducts);

// Notifications panel (user-scoped)
router.get('/notifications', DashboardController.getNotifications);
router.patch('/notifications/:id/read', DashboardController.markNotificationRead);

// Create transactions
router.post('/transactions', DashboardController.createTransaction);

export default router;
