import mongoose from "mongoose";
interface IBook {
    id?: mongoose.Types.ObjectId;
    rentalProviderId?: mongoose.Types.ObjectId;
    title: string;
    image: string;
    authorName: string;
    price: number;
    publishedDate: Date;
    pages: number;
    isFavourite: boolean;
    lastUpdatedDate: Date;
    genre?: string[];
    averageRating?: number;
    ratingsCount?: number;
    description?: string;
    tags?: string[];
}
export interface IBookDocument extends IBook, mongoose.Document { };
export const BookSchema = new mongoose.Schema<IBookDocument>({
    rentalProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    image: { type: String, required: true },
    authorName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    publishedDate: { type: Date, required: true },
    pages: { type: Number, required: true },
    lastUpdatedDate: { type: Date, required: true },
    genre: [{ type: String }],
    averageRating: { type: Number },
    ratingsCount: { type: Number },
    description: { type: String },
    tags: [{ type: String }],
});
export const BookModel = mongoose.models.Book || mongoose.model<IBookDocument>('Book', BookSchema);
