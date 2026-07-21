import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

const router = Router();

// Public route to list organizations for the pre-login workspace selector
router.get('/public', OrganizationController.getPublicOrganizations);

// Read-only view of the current org's plan, limits, and enabled screens
router.get('/current/plan', authenticate, OrganizationController.getCurrentPlan);

// Update the current org's own (tenant-editable) settings
router.patch(
  '/current',
  authenticate,
  requirePermission('settings.view', { skipScreenCheck: true }),
  OrganizationController.updateSettings
);

export default router;
