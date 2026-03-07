import mongoose from 'mongoose';

interface IRent {
    bookId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    rentStartDate: Date;
    rentEndDate: Date;
    amount: number;
    status: 'pending' | 'active' | 'completed' | 'cancelled';

}
export interface IRentDocument extends IRent, mongoose.Document { };

export const RentSchema = new mongoose.Schema<IRentDocument>({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rentStartDate: { type: Date, required: true },
    rentEndDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'active', 'completed', 'cancelled'], default: 'pending' },
})
export const RentModel = mongoose.models.Rent || mongoose.model<IRentDocument>('Rent', RentSchema);