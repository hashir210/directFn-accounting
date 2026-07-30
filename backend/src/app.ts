import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import organizationRoutes from './modules/organization/organization.routes';
import usersRoutes from './modules/users/users.routes';
import rolesRoutes from './modules/roles/roles.routes';
import platformRoutes from './modules/platform/platform.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import customersRoutes from './modules/customers/customers.routes';
import suppliersRoutes from './modules/suppliers/suppliers.routes';
import productsRoutes from './modules/products/products.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import notificationRoutes from './modules/notification/notification.routes';
import auditRoutes from './modules/audit/audit.routes';
import reportsRoutes from './modules/reports/reports.routes';
import pdfRoutes from './pdf/pdf.routes';
import salesOrdersRoutes from './modules/sales-orders/sales-orders.routes';
import salesReturnsRoutes from './modules/sales-returns/sales-returns.routes';
import discountsRoutes from './modules/discounts/discounts.routes';
import couponsRoutes from './modules/coupons/coupons.routes';
import purchaseOrdersRoutes from './modules/purchase-orders/purchase-orders.routes';
import supplierReturnsRoutes from './modules/supplier-returns/supplier-returns.routes';
import accountsRoutes from './modules/accounts/accounts.routes';
import journalEntriesRoutes from './modules/journal-entries/journal-entries.routes';
import accountingRoutes from './modules/accounting/accounting.routes';
import incomeRoutes from './modules/income/income.routes';
import bankAccountsRoutes from './modules/bank-accounts/bank-accounts.routes';
import taxesRoutes from './modules/taxes/taxes.routes';
import categoriesRoutes from './modules/categories/categories.routes';
// Import services to register event listeners globally
import './modules/notification/notification.service';
import './modules/audit/audit.service';
import logger from './utils/logger';

const app = express();

// Standard Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route / Health Check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Mounted Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/platform', platformRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/customers', customersRoutes);
app.use('/api/v1/suppliers', suppliersRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/pdf', pdfRoutes);

// Contact / Newsletter endpoint (public)
app.post('/api/v1/contact', (req: Request, res: Response) => {
  const { email, name, message } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  logger.info(`[Contact] Inquiry from ${email}${name ? ` (${name})` : ''}${message ? `: ${message}` : ''}`);
  res.status(200).json({ success: true, message: 'Thank you for reaching out. We will contact you soon.' });
});

app.use('/api/v1/sales-orders', salesOrdersRoutes);
app.use('/api/v1/sales-returns', salesReturnsRoutes);
app.use('/api/v1/discounts', discountsRoutes);
app.use('/api/v1/coupons', couponsRoutes);

app.use('/api/v1/purchase-orders', purchaseOrdersRoutes);
app.use('/api/v1/supplier-returns', supplierReturnsRoutes);

app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/journal-entries', journalEntriesRoutes);
app.use('/api/v1/accounting', accountingRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/bank-accounts', bankAccountsRoutes);
app.use('/api/v1/taxes', taxesRoutes);
app.use('/api/v1/categories', categoriesRoutes);

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log every error funneled through here. Unexpected (5xx) errors are logged
  // at 'error' level with a stack trace; expected client (4xx) errors are
  // logged at 'warn' level. Sensitive request bodies are intentionally omitted.
  const logMeta = {
    method: req.method,
    path: req.originalUrl,
    status,
    code: err.code || 'INTERNAL_ERROR',
  };
  if (status >= 500) {
    logger.error(`[error-handler]: ${message}`, { ...logMeta, stack: err.stack });
  } else {
    logger.warn(`[error-handler]: ${message}`, logMeta);
  }

  res.status(status).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
    details: err.details || null,
  });
});

export default app;
