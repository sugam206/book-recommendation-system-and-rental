import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import notificationController from '../controller/notification.controller';

const router = express.Router();

router.use(authenticateToken);

router.get('/', notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllNotificationsRead);
router.put('/:id/read', notificationController.markNotificationRead);

export default router;
