import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import prisma from '../config/db';

/**
 * Derives the Layer‑3 "screen" key from a Layer‑2 permission key.
 * Layer‑2 permissions are `module.action` (e.g. `invoices.view`); the org‑level
 * screen gate (`Organization.disabledScreens`) is keyed by module (`invoices`).
 */
function screenKeyFor(permissionKey: string): string {
  return permissionKey.split('.')[0];
}

interface PermissionOptions {
  /**
   * Explicit Layer‑3 screen key to check against the org's disabledScreens.
   * Defaults to the module prefix of the permission key.
   */
  screenKey?: string;
  /**
   * When true, skips the Layer‑3 (screen) gate. Used for management endpoints
   * (users/roles/settings) that are not themselves "screens".
   */
  skipScreenCheck?: boolean;
}

/**
 * Strict 3‑layer access guard.
 *
 *  Layer 1 — Identity/Role: the authenticated user carries a single roleId.
 *  Layer 2 — Role → Permission: the role must hold `permissionKey`
 *            (org Owners implicitly hold every permission within their org).
 *  Layer 3 — Org screen gate: the derived screen must not be in the org's
 *            `disabledScreens` list.
 *
 * Special cases:
 *  - FinFlow (the platform org, `isPlatform = true`) bypasses Layers 2 & 3.
 *  - A suspended org (`status !== 'active'`) is denied outright.
 */
export function requirePermission(permissionKey: string, options: PermissionOptions = {}) {
  const screenKey = options.screenKey ?? screenKeyFor(permissionKey);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User context not found in request');
      }

      const org = await prisma.organization.findUnique({
        where: { id: req.user.organizationId },
        select: { 
          ownerId: true, 
          isPlatform: true, 
          status: true,
          disabledScreens: true,
          plan: {
            select: {
              features: { select: { featureKey: true } }
            }
          }
        },
      });

      if (!org) {
        throw new UnauthorizedError('Organization not found or session expired');
      }

      // Suspended / inactive tenants are locked out entirely.
      if (org.status !== 'active') {
        throw new ForbiddenError('Your organization is suspended. Please contact support.');
      }

      // 0. Per-user Screen Restrictions (applies to non-owner users across all orgs)
      if (!options.skipScreenCheck && org.ownerId !== req.user.id) {
        const userBlock = await prisma.userScreenBlock.findUnique({
          where: {
            userId_screenKey: {
              userId: req.user.id,
              screenKey,
            },
          },
        });
        if (userBlock) {
          throw new ForbiddenError(`Access to this screen (${screenKey}) has been restricted for your user account`);
        }
      }

      // FinFlow platform org Owner/Admin: full access to everything, bypassing Layer 2 & 3.
      const isOwnerOrAdmin = org.ownerId === req.user.id;
      if (org.isPlatform && isOwnerOrAdmin) {
        return next();
      }

      // Layer 3 — Screen gates (Manual Org Screen Block & Subscription Plan limits)
      if (!options.skipScreenCheck) {
        // 1. Manual Org-level Screen Restrictions (set by FinFlow Platform Admin)
        if (org.disabledScreens) {
          try {
            const orgDisabled: string[] = JSON.parse(org.disabledScreens);
            if (orgDisabled.includes(screenKey)) {
              throw new ForbiddenError(`Access to this screen (${screenKey}) has been restricted by the platform administrator`);
            }
          } catch (e) {
            // invalid JSON fallback
          }
        }

        // 2. Subscription Plan Tier limits
        const planFeatures = org.plan?.features.map(pf => pf.featureKey) || [];
        if (planFeatures.length > 0 && !planFeatures.includes(screenKey)) {
          throw new ForbiddenError(`Access to this feature (${screenKey}) is not included in your organization's subscription plan`);
        }
      }

      // Organization team members have shared access to functional screens by default
      // unless explicitly restricted by UserScreenBlock or OrgDisabledScreens above.
      return next();
    } catch (error) {
      next(error);
    }
  };
}
