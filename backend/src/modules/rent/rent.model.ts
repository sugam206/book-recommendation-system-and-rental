import mongoose from 'mongoose';

interface IRent {
    bookId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    providerId?: mongoose.Types.ObjectId | null;
    requestedDays: number;
    rentStartDate: Date;
    rentEndDate: Date;
    amount: number;
    depositAmount: number;
    paymentProvider: 'khalti' | 'razorpay';
    paymentReference: string;
    paymentId?: string;
    paymentCurrency?: string;
    paymentAmountSubunits?: number;
    paymentStatus: 'pending' | 'held' | 'released' | 'refund_pending' | 'refunded';
    providerDecision: 'pending' | 'accepted' | 'rejected';
    adminDecision: 'pending' | 'confirmed_start' | 'confirmed_completion' | 'refund_processed';
    status: 'payment_pending' | 'deposit_held' | 'provider_accepted' | 'refund_pending' | 'active' | 'completed' | 'refunded' | 'cancelled';
    refundDueAt?: Date;
    refundedAt?: Date;
    releasedAt?: Date;
    paymentVerifiedAt?: Date;
}
export interface IRentDocument extends IRent, mongoose.Document { };

export const RentSchema = new mongoose.Schema<IRentDocument>({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedDays: { type: Number, required: true, min: 1, max: 60 },
    rentStartDate: { type: Date, required: true },
    rentEndDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    depositAmount: { type: Number, required: true, min: 0 },
    paymentProvider: { type: String, enum: ['khalti', 'razorpay'], default: 'razorpay' },
    paymentReference: { type: String, required: true, trim: true },
    paymentId: { type: String, trim: true },
    paymentCurrency: { type: String, trim: true, default: 'INR' },
    paymentAmountSubunits: { type: Number, min: 0 },
    paymentStatus: { type: String, enum: ['pending', 'held', 'released', 'refund_pending', 'refunded'], default: 'pending' },
    providerDecision: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    adminDecision: { type: String, enum: ['pending', 'confirmed_start', 'confirmed_completion', 'refund_processed'], default: 'pending' },
    status: {
        type: String,
        enum: ['payment_pending', 'deposit_held', 'provider_accepted', 'refund_pending', 'active', 'completed', 'refunded', 'cancelled'],
        default: 'payment_pending'
    },
    refundDueAt: { type: Date },
    refundedAt: { type: Date },
    releasedAt: { type: Date },
    paymentVerifiedAt: { type: Date }
}, { timestamps: true })
export const RentModel = mongoose.models.Rent || mongoose.model<IRentDocument>('Rent', RentSchema);
