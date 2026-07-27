import { Router } from 'express';
import { AccountingController } from './accounting.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/general-ledger', requirePermission('accounting.view', { screenKey: 'accounting' }), AccountingController.generalLedger);
router.get('/trial-balance', requirePermission('accounting.view', { screenKey: 'accounting' }), AccountingController.trialBalance);
router.get('/balance-sheet', requirePermission('accounting.view', { screenKey: 'accounting' }), AccountingController.balanceSheet);
router.get('/profit-loss', requirePermission('accounting.view', { screenKey: 'accounting' }), AccountingController.profitAndLoss);
router.get('/cash-flow', requirePermission('accounting.view', { screenKey: 'accounting' }), AccountingController.cashFlow);

export default router;
