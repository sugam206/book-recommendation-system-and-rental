import mongoose from 'mongoose';

interface INotification {
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'rent' | 'refund' | 'payment' | 'admin';
    isRead: boolean;
    rentId?: mongoose.Types.ObjectId;
}

export interface INotificationDocument extends INotification, mongoose.Document { }

export const NotificationSchema = new mongoose.Schema<INotificationDocument>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    category: { type: String, enum: ['rent', 'refund', 'payment', 'admin'], default: 'rent' },
    isRead: { type: Boolean, default: false },
    rentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rent' }
}, { timestamps: true });

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotificationDocument>(
    'Notification',
    NotificationSchema
);
