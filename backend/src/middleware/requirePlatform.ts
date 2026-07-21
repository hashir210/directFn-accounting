import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import prisma from '../config/db';

/**
 * Restricts a route to members of the FinFlow platform organization
 * (`Organization.isPlatform = true`). Used for all tenant‑management endpoints
 * (provisioning orgs, changing status/limits, screen restrictions, plans).
 *
 * Tenants can never manage other organizations — or create new ones.
 */
export async function requirePlatform(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User context not found in request');
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { isPlatform: true },
    });

    if (!org?.isPlatform) {
      throw new ForbiddenError('This action is restricted to platform administrators');
    }

    next();
  } catch (error) {
    next(error);
  }
}
