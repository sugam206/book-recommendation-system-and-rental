import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
interface IUser {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    preferredGenres?: string[];
    preferredAuthors?: string[];
    hasCompletedOnboarding?: boolean;
    isFavourite?: mongoose.Types.ObjectId;
    profilePicture?: string | null;
    isRenter?: boolean;
    rentalStatus?: 'inactive' | 'pending' | 'approved' | 'rejected';
    currentRentalRequestId?: mongoose.Types.ObjectId;
    rentalApprovedDate?: Date;
    savedBooks?: mongoose.Types.ObjectId[];
    readingList?: {
        bookId: mongoose.Types.ObjectId;
        status: 'want_to_read' | 'reading' | 'completed';
        addedAt: Date;
        updatedAt: Date;
    }[];
    bookRatings?: {
        bookId: mongoose.Types.ObjectId;
        rating: number;
        updatedAt: Date;
    }[];

}
export interface IUserDocument extends IUser, mongoose.Document { };
export const UserSchema = new mongoose.Schema<IUserDocument>({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    preferredGenres: [{ type: String, trim: true }],
    preferredAuthors: [{ type: String, trim: true }],
    hasCompletedOnboarding: { type: Boolean, default: false },
    isFavourite: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    profilePicture: { type: String, default: null },
    isRenter: { type: Boolean, default: false },
    rentalStatus: { type: String, enum: ['inactive', 'pending', 'approved', 'rejected'], default: 'inactive' },
    currentRentalRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalRequest' },
    rentalApprovedDate: { type: Date },
    savedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    readingList: [{
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
        status: { type: String, enum: ['want_to_read', 'reading', 'completed'], default: 'want_to_read' },
        addedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }],
    bookRatings: [{
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        updatedAt: { type: Date, default: Date.now }
    }]


}, { timestamps: true });
UserSchema.pre('save', async function () {
    const user = this as IUserDocument;
    if (!user.isModified('password')) return;
    user.password = await bcrypt.hash(user.password, 10);


});
export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
