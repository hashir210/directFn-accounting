import { PrismaClient } from '@prisma/client';
import eventEmitter, { EventTypes } from '../../utils/events';
import { getIo } from '../../socket';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Generates a new notification, saves it to DB, and emits it to the user.
   */
  static async sendNotification(data: {
    organizationId: string;
    userId: string;
    title: string;
    message: string;
    type?: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    try {
      // 1. Save to database
      const notification = await prisma.notification.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          referenceType: data.referenceType,
          referenceId: data.referenceId,
        },
      });

      // 2. Emit via WebSockets
      try {
        const io = getIo();
        // Emit to the specific user's room (which contains all their connected devices)
        io.to(data.userId).emit('new_notification', notification);
      } catch (wsError) {
        // If getIo() throws (e.g. during testing) or other ws error, just log it.
        console.error('[NotificationService] WebSocket error:', wsError);
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] Failed to send notification:', error);
      throw error;
    }
  }

  static async getNotifications(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}

// ==========================================
// Event Listeners
// ==========================================

eventEmitter.on(EventTypes.INVOICE_PAID, async (payload: { organizationId: string; userId: string; invoiceNo: string; amount: string; invoiceId: string }) => {
  await NotificationService.sendNotification({
    organizationId: payload.organizationId,
    userId: payload.userId,
    title: 'Invoice Paid',
    message: `Invoice ${payload.invoiceNo} for $${payload.amount} has been marked as paid.`,
    type: 'success',
    referenceType: 'Invoice',
    referenceId: payload.invoiceId,
  });
});

eventEmitter.on(EventTypes.AUTH_LOGIN_ALERT, async (payload: { organizationId: string; userId: string; ip: string; browser: string }) => {
  await NotificationService.sendNotification({
    organizationId: payload.organizationId,
    userId: payload.userId,
    title: 'Security Alert: New Login',
    message: `New login detected from IP ${payload.ip} via ${payload.browser}.`,
    type: 'warning',
  });
});

eventEmitter.on(EventTypes.STOCK_LOW, async (payload: { organizationId: string; userId: string; productName: string; quantity: number; productId: string }) => {
  await NotificationService.sendNotification({
    organizationId: payload.organizationId,
    userId: payload.userId,
    title: 'Low Stock Alert',
    message: `Product "${payload.productName}" is running low on stock. Only ${payload.quantity} left.`,
    type: 'warning',
    referenceType: 'Product',
    referenceId: payload.productId,
  });
});
