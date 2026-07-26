import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { z } from 'zod';

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limitStr = req.query.limit as string;
      const limit = limitStr ? parseInt(limitStr, 10) : 50;

      const notifications = await NotificationService.getNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error('[NotificationController.getNotifications] Error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id, userId);
      res.json(notification);
    } catch (error) {
      console.error('[NotificationController.markAsRead] Error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await NotificationService.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read', count: result.count });
    } catch (error) {
      console.error('[NotificationController.markAllAsRead] Error:', error);
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  }
}
