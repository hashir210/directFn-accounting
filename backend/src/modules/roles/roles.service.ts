import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class RolesService {
  static async listRoles(organizationId: string) {
    return prisma.role.findMany({
      where: { organizationId },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, key: true, description: true } } },
        },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async listPermissions() {
    return prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  static async getRolePermissions(roleId: string, organizationId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundError('Role not found in your organization');
    }
    return {
      id: role.id,
      name: role.name,
      isSystemRole: role.isSystemRole,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  /**
   * Replaces a role's permission set with the exact list provided (used by the
   * checkbox/tick UI). System roles (e.g. Owner) are immutable.
   */
  static async setRolePermissions(roleId: string, permissionIds: string[], organizationId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundError('Role not found in your organization');
    }
    if (role.isSystemRole) {
      throw new BadRequestError('Cannot modify system role permissions');
    }

    const ids = Array.from(new Set(permissionIds ?? []));

    if (ids.length > 0) {
      const found = await prisma.permission.findMany({ where: { id: { in: ids } }, select: { id: true } });
      if (found.length !== ids.length) {
        throw new BadRequestError('One or more permissions do not exist');
      }
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...(ids.length > 0
        ? [prisma.rolePermission.createMany({ data: ids.map((permissionId) => ({ roleId, permissionId })) })]
        : []),
    ]);

    return this.getRolePermissions(roleId, organizationId);
  }

  static async assignPermission(roleId: string, permissionId: string, organizationId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundError('Role not found in your organization');
    }
    if (role.isSystemRole) {
      throw new BadRequestError('Cannot modify system role permissions');
    }

    const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (existing) {
      throw new BadRequestError('Permission already assigned to this role');
    }

    return prisma.rolePermission.create({
      data: { roleId, permissionId },
      include: { permission: true },
    });
  }

  static async removePermission(roleId: string, permissionId: string, organizationId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundError('Role not found in your organization');
    }
    if (role.isSystemRole) {
      throw new BadRequestError('Cannot modify system role permissions');
    }

    const rp = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!rp) {
      throw new NotFoundError('Permission not assigned to this role');
    }

    await prisma.rolePermission.delete({ where: { id: rp.id } });
    return { message: 'Permission removed from role' };
  }
}
