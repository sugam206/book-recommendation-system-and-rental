import type { Request, Response } from 'express';
import asyncHandeler from '../middleware/asyncHandler';
import { NotificationModel } from '../modules/notification/notification.model';

export class NotificationController {
    getMyNotifications = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const unreadOnly = req.query.unreadOnly === 'true';
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        const query: Record<string, any> = { userId: req.user.id };
        if (unreadOnly) {
            query.isRead = false;
        }

        const notifications = await NotificationModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        const unreadCount = await NotificationModel.countDocuments({
            userId: req.user.id,
            isRead: false
        });

        res.status(200).json({ notifications, unreadCount });
    });

    markNotificationRead = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const notification = await NotificationModel.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ notification });
    });

    markAllNotificationsRead = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await NotificationModel.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ success: true });
    });
}

export default new NotificationController();
