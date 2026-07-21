import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { OrganizationService } from '../organization/organization.service';

export class PlatformService {
  static async listOrganizations() {
    return prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        planId: true,
        plan: { select: { id: true, name: true } },
        status: true,
        isPlatform: true,
        disabledScreens: true,
        contactEmail: true,
        maxUsers: true,
        createdAt: true,
        _count: { select: { users: true, invoices: true, customers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOrganizationScreens(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, disabledScreens: true },
    });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    let disabledScreens: string[] = [];
    if (org.disabledScreens) {
      try {
        disabledScreens = JSON.parse(org.disabledScreens);
      } catch {
        disabledScreens = [];
      }
    }
    return { id: org.id, name: org.name, disabledScreens };
  }

  static async updateOrganizationScreens(orgId: string, disabledScreens: string[]) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        disabledScreens: JSON.stringify(disabledScreens),
      },
      select: { id: true, name: true, disabledScreens: true },
    });

    let parsed: string[] = [];
    if (updated.disabledScreens) {
      try {
        parsed = JSON.parse(updated.disabledScreens);
      } catch {
        parsed = [];
      }
    }

    return { id: updated.id, name: updated.name, disabledScreens: parsed };
  }

  static async getStats() {
    const [orgCount, userCount, totalInvoices, paidInvoices, totalExpenses] = await Promise.all([
      prisma.organization.count({ where: { isPlatform: false } }),
      prisma.user.count(),
      prisma.invoice.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'paid' } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    return {
      totalOrganizations: orgCount,
      totalUsers: userCount,
      totalInvoiced: totalInvoices._sum.amount?.toNumber() || 0,
      totalPaid: paidInvoices._sum.amount?.toNumber() || 0,
      totalExpenses: totalExpenses._sum.amount?.toNumber() || 0,
      invoiceCount: totalInvoices._count,
    };
  }

  static async createB2bOrganization(data: {
    orgName: string;
    ownerName?: string;
    ownerEmail: string;
    password: string;
    planId?: string;
    contactEmail?: string;
    maxUsers?: number;
  }) {
    // Owner email is unique per organization; a fresh tenant owner must not
    // already own/belong to an org. (Same-email-across-orgs is allowed for
    // invited members, but a provisioned owner starts clean.)
    const existingUser = await prisma.user.findFirst({
      where: { email: data.ownerEmail },
    });
    if (existingUser) {
      throw new BadRequestError('A user with this owner email already exists');
    }

    if (data.planId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
      if (!plan) {
        throw new BadRequestError('Selected subscription plan does not exist');
      }
    }

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(data.password, 10);

    const { org, user } = await OrganizationService.createOrganizationWithUser(
      data.orgName,
      { email: data.ownerEmail, passwordHash, name: data.ownerName }
    );

    const updateData: {
      planId?: string;
      contactEmail?: string;
      maxUsers?: number;
    } = {};
    if (data.planId) updateData.planId = data.planId;
    if (data.contactEmail) updateData.contactEmail = data.contactEmail;
    if (data.maxUsers !== undefined) updateData.maxUsers = data.maxUsers;

    if (Object.keys(updateData).length > 0) {
      await prisma.organization.update({
        where: { id: org.id },
        data: updateData,
      });
    }

    return { org, user };
  }

  static async updateOrganizationStatus(orgId: string, status: string) {
    const allowedStatuses = ['active', 'suspended', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestError(`Status must be one of: ${allowedStatuses.join(', ')}`);
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    if (org.isPlatform) {
      throw new BadRequestError('The platform organization status cannot be changed');
    }

    return prisma.organization.update({
      where: { id: orgId },
      data: { status },
      select: { id: true, name: true, planId: true, status: true },
    });
  }

  static async updateOrganizationLimits(
    orgId: string,
    data: { maxUsers?: number; contactEmail?: string; planId?: string | null }
  ) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { _count: { select: { users: true } } },
    });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    if (data.maxUsers !== undefined && data.maxUsers !== null) {
      if (data.maxUsers < 1) {
        throw new BadRequestError('Max users must be at least 1');
      }
      if (data.maxUsers < org._count.users) {
        throw new BadRequestError(
          `Max users cannot be below the current user count (${org._count.users})`
        );
      }
    }

    if (data.planId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
      if (!plan) {
        throw new BadRequestError('Selected subscription plan does not exist');
      }
    }

    const updateData: {
      maxUsers?: number;
      contactEmail?: string | null;
      planId?: string | null;
    } = {};
    if (data.maxUsers !== undefined) updateData.maxUsers = data.maxUsers;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.planId !== undefined) updateData.planId = data.planId;

    return prisma.organization.update({
      where: { id: orgId },
      data: updateData,
      select: {
        id: true,
        name: true,
        maxUsers: true,
        contactEmail: true,
        planId: true,
        plan: { select: { id: true, name: true } },
      },
    });
  }
}
