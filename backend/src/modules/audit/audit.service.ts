import { PrismaClient } from '@prisma/client';
import eventEmitter, { EventTypes } from '../../utils/events';
import { getIo } from '../../socket';

const prisma = new PrismaClient();

class AuditService {
  constructor() {
    // Listen for incoming audit log events
    eventEmitter.on(EventTypes.AUDIT_LOG, this.handleAuditLog.bind(this));
  }

  /**
   * Handle incoming audit log events
   * Persists them to DB and broadcasts to admins via WebSockets
   */
  private async handleAuditLog(payload: {
    organizationId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }) {
    try {
      // 1. Persist to DB
      const log = await prisma.auditLog.create({
        data: {
          organizationId: payload.organizationId,
          userId: payload.userId,
          action: payload.action,
          entity: payload.entity,
          entityId: payload.entityId,
          details: payload.details,
          ipAddress: payload.ipAddress,
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      // 2. Broadcast to admins via WebSockets (Real-time feed)
      try {
        const io = getIo();
        if (io) {
          // Emit to the organization's admin room
          io.to(`org_${payload.organizationId}_admins`).emit('new_audit_log', log);
        }
      } catch (e) {
        // io might not be initialized during early startup or testing
      }
    } catch (error) {
      console.error('[AuditService] Failed to handle audit log:', error);
    }
  }

  /**
   * Fetch historical audit logs for an organization
   */
  public async getLogs(organizationId: string, limit: number = 50, offset: number = 0) {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where: { organizationId } }),
      prisma.auditLog.findMany({
        where: { organizationId },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return { total, logs };
  }
}

// Export a singleton instance
export const auditService = new AuditService();
