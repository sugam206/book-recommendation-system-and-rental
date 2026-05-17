import { Types } from 'mongoose';
import { NotificationModel } from '../modules/notification/notification.model';

type NotificationPayload = {
    userId: Types.ObjectId | string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    category?: 'rent' | 'refund' | 'payment' | 'admin';
    rentId?: Types.ObjectId | string;
};

export const createNotification = async (payload: NotificationPayload) => {
    await NotificationModel.create({
        userId: new Types.ObjectId(payload.userId),
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
        category: payload.category || 'rent',
        rentId: payload.rentId ? new Types.ObjectId(payload.rentId) : undefined
    });
};

export const createNotifications = async (payloads: NotificationPayload[]) => {
    if (!payloads.length) return;

    await NotificationModel.insertMany(payloads.map((payload) => ({
        userId: new Types.ObjectId(payload.userId),
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
        category: payload.category || 'rent',
        rentId: payload.rentId ? new Types.ObjectId(payload.rentId) : undefined
    })));
};
