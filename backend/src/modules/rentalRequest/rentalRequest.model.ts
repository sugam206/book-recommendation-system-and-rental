import mongoose from 'mongoose';

interface IRentalRequest {
    userId: mongoose.Types.ObjectId;
    businessName: string;
    businessDescription: string;
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    rentalTermsPreference: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: Date;
    reviewedDate?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    adminNotes?: string;
}

export interface IRentalRequestDocument extends IRentalRequest, mongoose.Document { }

export const RentalRequestSchema = new mongoose.Schema<IRentalRequestDocument>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    businessDescription: {
        type: String,
        required: true,
        trim: true
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'expert'],
        required: true
    },
    rentalTermsPreference: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    reviewedDate: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminNotes: {
        type: String
    }
}, { timestamps: true });

export const RentalRequestModel = mongoose.model<IRentalRequestDocument>(
    'RentalRequest',
    RentalRequestSchema
);
