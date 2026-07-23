import crypto from 'crypto';
import prisma from '../../config/db';
import { NotFoundError } from '../../utils/errors';

export class OrganizationService {
  /**
   * Fetch all organizations for the pre-login workspace selector.
   * Public endpoint.
   */
  static async getPublicOrganizations() {
    const allOrgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        isPlatform: true,
      },
      orderBy: [
        { isPlatform: 'desc' },
        { name: 'asc' },
      ],
    });

    return {
      platform: allOrgs.filter(o => o.isPlatform).map(({ isPlatform, ...rest }) => rest),
      customerOrgs: allOrgs.filter(o => !o.isPlatform).map(({ isPlatform, ...rest }) => rest),
    };
  }

  /**
   * Creates a new organization, basic roles, and assigns the owner.
   */
  static async createOrganizationWithUser(
    orgName: string, 
    userPayload: { email: string; passwordHash: string; name?: string }
  ) {
    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    // Fetch all available permissions to assign to the Owner role
    const allPermissions = await prisma.permission.findMany();

    return prisma.$transaction(async (tx) => {
      // 1. Temporarily disable foreign key checks for this transaction to resolve the circular dependency
      //    (Organization requires ownerId, User requires organizationId)
      await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0;`);

      // 2. Create the Organization
      const org = await tx.organization.create({
        data: {
          id: orgId,
          name: orgName,
          ownerId: userId,
        },
      });

      // 3. Create Default Phase 4 Roles
      const adminRole = await tx.role.create({
        data: { organizationId: orgId, name: 'Admin', isSystemRole: true }
      });
      await tx.role.create({
        data: { organizationId: orgId, name: 'Accountant', isSystemRole: true }
      });
      await tx.role.create({
        data: { organizationId: orgId, name: 'Cashier', isSystemRole: true }
      });
      await tx.role.create({
        data: { organizationId: orgId, name: 'Sales Person', isSystemRole: true }
      });
      await tx.role.create({
        data: { organizationId: orgId, name: 'Store Manager', isSystemRole: true }
      });

      // 4. Create the User (Admin Owner)
      const user = await tx.user.create({
        data: {
          id: userId,
          organizationId: orgId,
          roleId: adminRole.id,
          email: userPayload.email,
          password: userPayload.passwordHash,
          name: userPayload.name,
          emailVerified: false,
        },
      });

      // 5. Re-enable foreign key checks
      await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`);

      // 6. Assign all permissions to the Admin Role
      const rolePermissionsData = allPermissions.map(p => ({
        roleId: adminRole.id,
        permissionId: p.id,
      }));
      
      if (rolePermissionsData.length > 0) {
        await tx.rolePermission.createMany({
          data: rolePermissionsData,
        });
      }

      return { org, user };
    });
  }

  /**
   * Get full organization profile for the current logged in tenant.
   */
  static async getCurrentOrg(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        gstVatNumber: true,
        address: true,
        fiscalYear: true,
        currency: true,
        timeZone: true,
        logoUrl: true,
        status: true,
        maxUsers: true,
        disabledScreens: true,
        createdAt: true,
      },
    });

    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    return org;
  }

  /**
   * Updates organization settings that a tenant is allowed to change itself.
   *
   * NOTE: platform‑controlled fields (`maxUsers`, `disabledScreens`, `planId`,
   * `status`, `isPlatform`) are intentionally NOT editable here — those are only
   * mutable through the platform (FinFlow) endpoints.
   */
  static async updateOrganization(orgId: string, data: {
    name?: string;
    contactEmail?: string;
    gstVatNumber?: string;
    address?: string;
    fiscalYear?: string;
    currency?: string;
    timeZone?: string;
    logoUrl?: string;
  }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.gstVatNumber !== undefined) updateData.gstVatNumber = data.gstVatNumber;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.fiscalYear !== undefined) updateData.fiscalYear = data.fiscalYear;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.timeZone !== undefined) updateData.timeZone = data.timeZone;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

    if (Object.keys(updateData).length === 0) {
      return this.getCurrentOrg(orgId);
    }

    return prisma.organization.update({
      where: { id: orgId },
      data: updateData,
      select: {
        id: true,
        name: true,
        contactEmail: true,
        gstVatNumber: true,
        address: true,
        fiscalYear: true,
        currency: true,
        timeZone: true,
        logoUrl: true,
      },
    });
  }

  /**
   * Read‑only view of an organization's subscription plan and allowed features.
   * Available to the org's own members.
   */
  static async getOrganizationPlan(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        status: true,
        maxUsers: true,
        contactEmail: true,
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            features: { select: { featureKey: true } },
          },
        },
        _count: { select: { users: true } },
      },
    });

    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const planFeatures = org.plan?.features.map(f => f.featureKey) || [];

    return {
      id: org.id,
      name: org.name,
      status: org.status,
      maxUsers: org.maxUsers,
      contactEmail: org.contactEmail,
      plan: org.plan ? { id: org.plan.id, name: org.plan.name, description: org.plan.description } : null,
      userCount: org._count.users,
      planFeatures,
    };
  }
}

