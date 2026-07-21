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
import reportsRoutes from './modules/reports/reports.routes';
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
