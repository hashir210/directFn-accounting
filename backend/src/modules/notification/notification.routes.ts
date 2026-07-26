import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);

export default router;
