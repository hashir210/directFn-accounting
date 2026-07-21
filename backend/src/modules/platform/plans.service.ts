import prisma from '../../config/db';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';

/**
 * Subscription plans govern what features/screens a tenant organization can access.
 */
export class PlansService {
  static async listPlans() {
    return prisma.subscriptionPlan.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        features: { select: { featureKey: true } },
        createdAt: true,
        _count: { select: { organizations: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createPlan(data: { name: string; description?: string }) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestError('Plan name is required');
    }

    const existing = await prisma.subscriptionPlan.findUnique({ where: { name: data.name.trim() } });
    if (existing) {
      throw new ConflictError('A plan with this name already exists');
    }

    return prisma.subscriptionPlan.create({
      data: { name: data.name.trim(), description: data.description },
    });
  }

  static async updatePlan(id: string, data: { name?: string; description?: string }) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    if (data.name && data.name.trim() !== plan.name) {
      const clash = await prisma.subscriptionPlan.findUnique({ where: { name: data.name.trim() } });
      if (clash) {
        throw new ConflictError('A plan with this name already exists');
      }
    }

    return prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description: data.description,
      },
    });
  }

  static async deletePlan(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { organizations: true } } },
    });
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    if (plan._count.organizations > 0) {
      throw new BadRequestError('Cannot delete a plan that is assigned to organizations');
    }

    await prisma.subscriptionPlan.delete({ where: { id } });
    return { message: 'Plan deleted successfully' };
  }

  static async getPlanFeatures(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { features: true },
    });
    if (!plan) throw new NotFoundError('Plan not found');
    return plan.features.map(f => f.featureKey);
  }

  static async setPlanFeatures(id: string, features: string[]) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundError('Plan not found');

    await prisma.$transaction([
      prisma.planFeature.deleteMany({ where: { planId: id } }),
      prisma.planFeature.createMany({
        data: features.map(featureKey => ({
          planId: id,
          featureKey,
        })),
      }),
    ]);

    return this.getPlanFeatures(id);
  }
}
