import { Router } from 'express';
import { PlatformController } from './platform.controller';
import { PlansController } from './plans.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePlatform } from '../../middleware/requirePlatform';

const router = Router();

// Every platform endpoint is restricted to the FinFlow platform organization.
router.use(authenticate);
router.use(requirePlatform);

// ─── Tenant organization management ──────────────────────────────────────────
router.get('/organizations', PlatformController.listOrganizations);
router.post('/organizations', PlatformController.createOrganization);
router.patch('/organizations/:id/status', PlatformController.updateOrganizationStatus);
router.patch('/organizations/:id/limits', PlatformController.updateOrganizationLimits);
router.get('/organizations/:id/screens', PlatformController.getOrganizationScreens);
router.put('/organizations/:id/screens', PlatformController.updateOrganizationScreens);
router.get('/stats', PlatformController.getStats);

// ─── Subscription plan (label) management ────────────────────────────────────
router.get('/plans', PlansController.listPlans);
router.post('/plans', PlansController.createPlan);
router.patch('/plans/:id', PlansController.updatePlan);
router.delete('/plans/:id', PlansController.deletePlan);
router.get('/plans/:id/features', PlansController.getPlanFeatures);
router.put('/plans/:id/features', PlansController.setPlanFeatures);

export default router;
