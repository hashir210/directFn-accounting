import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// All dashboard routes require a valid JWT
router.use(authenticate);

// Summary: revenue, expenses, P&L, cash flow
router.get('/summary', DashboardController.getSummary);

// Bank balance card
router.get('/bank-balance', DashboardController.getBankBalance);

// Pending payments list (paginated)
router.get('/pending-payments', DashboardController.getPendingPayments);

// Monthly sales chart
router.get('/monthly-sales', DashboardController.getMonthlySales);

// Monthly expenses chart
router.get('/monthly-expenses', DashboardController.getMonthlyExpenses);

// Top customers — manager & admin only
router.get('/top-customers', authorize(['admin', 'manager']), DashboardController.getTopCustomers);

// Low stock alerts
router.get('/low-stock', DashboardController.getLowStockProducts);

// Notifications panel (user-scoped)
router.get('/notifications', DashboardController.getNotifications);
router.patch('/notifications/:id/read', DashboardController.markNotificationRead);

export default router;
