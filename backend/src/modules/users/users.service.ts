import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../config/db';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';

export class UsersService {
  static async listUsers(organizationId: string, targetOrgId?: string, isPlatformAdmin: boolean = false) {
    const effectiveOrgId = (isPlatformAdmin && targetOrgId) ? targetOrgId : organizationId;
    return prisma.user.findMany({
      where: { organizationId: effectiveOrgId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        twoFactorEnabled: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async inviteUser(data: { email: string; name?: string; roleId: string; targetOrgId?: string }, organizationId: string, currentUserId: string, isPlatformAdmin: boolean = false) {
    const effectiveOrgId = (isPlatformAdmin && data.targetOrgId) ? data.targetOrgId : organizationId;
    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role || role.organizationId !== effectiveOrgId) {
      throw new BadRequestError('Role not found in organization');
    }

    const organization = await prisma.organization.findUnique({
      where: { id: effectiveOrgId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    if (!organization.isPlatform && organization._count.users >= organization.maxUsers) {
      throw new BadRequestError(`User limit reached. Organization is limited to ${organization.maxUsers} users.`);
    }

    const existing = await prisma.user.findUnique({
      where: { organizationId_email: { organizationId, email: data.email } },
    });
    if (existing) {
      throw new BadRequestError('A user with this email already exists in your organization');
    }

    const tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        organizationId: effectiveOrgId,
        roleId: data.roleId,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        emailVerified: false,
      },
    });

    return { user: { id: user.id, email: user.email, name: user.name, roleId: user.roleId }, tempPassword };
  }

  static async updateUser(userId: string, data: { name?: string; roleId?: string }, organizationId: string, currentUserId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) {
      throw new NotFoundError('User not found in your organization');
    }

    if (data.roleId && userId === currentUserId && data.roleId !== user.roleId) {
      throw new BadRequestError('You cannot change your own role');
    }

    if (data.roleId) {
      const role = await prisma.role.findUnique({ where: { id: data.roleId } });
      if (!role || role.organizationId !== organizationId) {
        throw new BadRequestError('Role not found in your organization');
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.roleId ? { roleId: data.roleId } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  static async updateUserRole(userId: string, roleId: string, organizationId: string, currentUserId: string) {
    return this.updateUser(userId, { roleId }, organizationId, currentUserId);
  }

  static async removeUser(userId: string, organizationId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestError('You cannot remove yourself');
    }

    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) {
      throw new NotFoundError('User not found in your organization');
    }

    await prisma.user.delete({ where: { id: userId } });
    return { message: 'User removed successfully' };
  }

  /** Get blocked screen keys for a specific user */
  static async getUserScreenBlocks(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundError('User not found in your organization');

    const blocks = await prisma.userScreenBlock.findMany({
      where: { userId },
      select: { screenKey: true },
    });
    return blocks.map(b => b.screenKey);
  }

  /** Replace all screen blocks for a user */
  static async setUserScreenBlocks(userId: string, screenKeys: string[], organizationId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundError('User not found in your organization');

    await prisma.$transaction([
      prisma.userScreenBlock.deleteMany({ where: { userId } }),
      prisma.userScreenBlock.createMany({
        data: screenKeys.map(screenKey => ({ userId, screenKey })),
      }),
    ]);

    return this.getUserScreenBlocks(userId, organizationId);
  }
}
