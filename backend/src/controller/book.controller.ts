import { Types } from "mongoose";
import asyncHandeler from "../middleware/asyncHandler";
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { UserModel } from "../modules/user/user.model";
import { BookModel } from "../modules/books/book.model";
const getRentAvailabilityMeta = () => ({
    isAvailableForRent: true,
    availabilityStatus: 'available',
    availabilityMessage: 'Available for rent'
});



export class BookController {

    // ─── POST / ───────────────────────────────────────────────────────────────
    createBook = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await UserModel.findById(req.user.id).select('role rentalStatus');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const canCreateBook = user.role === 'admin' || user.rentalStatus === 'approved';
        if (!canCreateBook) {
            return res.status(403).json({
                message: 'Only admins or approved rental providers can add books for rent'
            });
        }

        const { title, authorName, publishedDate, pages, price, rentalProviderId, description, genre, tags } = req.body;

        if (!title || !authorName || !publishedDate || !pages || price === undefined) {
            return res.status(400).json({ message: 'title, authorName, publishedDate, pages and price are required' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Cover image is required' });
        }

        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ message: 'Price must be a valid non-negative number' });
        }

        let resolvedRentalProviderId = req.user.id;
        if (req.user.role === 'admin') {
            if (!rentalProviderId || !Types.ObjectId.isValid(rentalProviderId)) {
                return res.status(400).json({ message: 'A valid rental provider is required' });
            }

            const provider = await UserModel.findById(rentalProviderId).select('rentalStatus');
            if (!provider || provider.rentalStatus !== 'approved') {
                return res.status(400).json({ message: 'Rental provider must be an approved rental user' });
            }

            resolvedRentalProviderId = rentalProviderId;
        }

        const book = await BookModel.create({
            rentalProviderId: resolvedRentalProviderId,
            title,
            authorName,
            image: `/uploads/books/${path.basename(req.file.path)}`,
            price: numericPrice,
            publishedDate: new Date(publishedDate),
            pages: Number(pages),
            lastUpdatedDate: new Date(),
            isFavourite: false,
            description: description || '',
            genre: genre
                ? (Array.isArray(genre) ? genre : [genre])
                : [],
            tags: tags
                ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim()).filter(Boolean))
                : [],
        });

        res.status(201).json({ book });
    });

    getMyBooks = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [books, user] = await Promise.all([
            BookModel.find({ rentalProviderId: req.user.id }).sort({ lastUpdatedDate: -1 }),
            UserModel.findById(req.user.id).select('savedBooks')
        ]);

        const favSet = new Set((user?.savedBooks || []).map((id: Types.ObjectId) => id.toString()));
        const booksWithFlag = books.map((book) => ({
            ...book.toObject(),
            isFavourite: favSet.has(book._id.toString())
        }));

        res.status(200).json({ books: booksWithFlag });
    });

    // ─── GET / ────────────────────────────────────────────────────────────────
    getAllBooks = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';

        const query = search
            ? {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { authorName: { $regex: search, $options: 'i' } },
                    { genre: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } },
                ],
            }
            : {};

        const [books, total] = await Promise.all([
            BookModel.find(query)
                .sort({ lastUpdatedDate: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            BookModel.countDocuments(query),
        ]);

        // mark favourites from user
        const user = await UserModel.findById(req.user.id);
        const favSet = new Set(user?.savedBooks?.map((id: Types.ObjectId) => id.toString()));
        const readingMap = new Map(
            (user?.readingList || []).map((entry: any) => [entry.bookId.toString(), entry.status])
        );
        const ratingMap = new Map(
            (user?.bookRatings || []).map((entry: any) => [entry.bookId.toString(), entry.rating])
        );
        const booksWithFlag = books.map((b) => ({
            ...b.toObject(),
            isFavourite: favSet.has(b._id.toString()),
            readingStatus: readingMap.get(b._id.toString()) || null,
            myRating: ratingMap.get(b._id.toString()) || null,
            ...getRentAvailabilityMeta()
        }));

        res.status(200).json({
            books: booksWithFlag,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // ─── GET /:id ─────────────────────────────────────────────────────────────
    getBookById = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const book = await BookModel.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        const user = await UserModel.findById(req.user.id);
        const isFav = user?.savedBooks?.some((id: Types.ObjectId) => id.toString() === book._id.toString());
        const readingEntry = (user?.readingList || []).find((entry: any) => entry.bookId.toString() === book._id.toString());
        const ratingEntry = (user?.bookRatings || []).find((entry: any) => entry.bookId.toString() === book._id.toString());
        res.status(200).json({
            book: {
                ...book.toObject(),
                isFavourite: !!isFav,
                readingStatus: readingEntry?.status || null,
                myRating: ratingEntry?.rating || null,
                ...getRentAvailabilityMeta()
            }
        });
    });

    // ─── PUT /:id ─────────────────────────────────────────────────────────────
    updateBook = asyncHandeler(async (req: Request, res: Response) => {
        const existing = await BookModel.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const user = await UserModel.findById(req.user?.id).select('role rentalStatus');
        const assignedProviderId = existing.rentalProviderId?.toString();
        const canManageBook = req.user?.role === 'admin'
            || (assignedProviderId === req.user?.id?.toString() && user?.rentalStatus === 'approved');

        if (!canManageBook) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Build update payload from body fields
        const { title, authorName, publishedDate, pages, price, rentalProviderId, description, genre, tags, isFavourite } = req.body;

        const updateData: Record<string, any> = {
            lastUpdatedDate: new Date(),
        };

        if (title) updateData.title = title;
        if (authorName) updateData.authorName = authorName;
        if (publishedDate) updateData.publishedDate = new Date(publishedDate);
        if (pages) updateData.pages = Number(pages);
        if (price !== undefined) updateData.price = Number(price);
        if (rentalProviderId !== undefined) {
            if (!Types.ObjectId.isValid(rentalProviderId)) {
                return res.status(400).json({ message: 'Invalid rental provider ID' });
            }

            const provider = await UserModel.findById(rentalProviderId).select('rentalStatus');
            if (!provider || provider.rentalStatus !== 'approved') {
                return res.status(400).json({ message: 'Rental provider must be an approved rental user' });
            }

            updateData.rentalProviderId = rentalProviderId;
        }
        if (description !== undefined) updateData.description = description;
        if (isFavourite !== undefined) updateData.isFavourite = isFavourite === 'true' || isFavourite === true;
        if (genre) updateData.genre = Array.isArray(genre) ? genre : [genre];
        if (tags) updateData.tags = Array.isArray(tags)
            ? tags
            : String(tags).split(',').map((t: string) => t.trim()).filter(Boolean);

        // BUG FIX: use updateData (not req.body) so new image path is included
        if (req.file) {
            // Delete old image from disk
            if (existing.image) {
                const oldImagePath = path.join('uploads/books', path.basename(existing.image));
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.warn('Could not delete old image:', err);
                }
            }
            updateData.image = `/uploads/books/${path.basename(req.file.path)}`;
        }

        const updatedBook = await BookModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({ book: updatedBook });
    });

    insertManyBooks = asyncHandeler(async (req: Request, res: Response) => {
        try {
            const payload = (req.body.books || []).map((book: Record<string, any>) => ({
                ...book,
                rentalProviderId: book.rentalProviderId
            }));
            const books = await BookModel.insertMany(payload);
            res.status(201).json({ books });
        } catch (error) {
            res.status(400).json({ message: 'Error inserting books', error });
        }
    });
    // ─── DELETE /:id ──────────────────────────────────────────────────────────
    deleteBook = asyncHandeler(async (req: Request, res: Response) => {
        const book = await BookModel.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const user = await UserModel.findById(req.user?.id).select('role rentalStatus');
        const assignedProviderId = book.rentalProviderId?.toString();
        const canManageBook = req.user?.role === 'admin'
            || (assignedProviderId === req.user?.id?.toString() && user?.rentalStatus === 'approved');

        if (!canManageBook) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await book.deleteOne();

        // BUG FIX: delete image file from disk (was missing before)
        if (book.image) {
            const imagePath = path.join('uploads/books', path.basename(book.image));
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.warn('Could not delete image file:', err);
            }
        }

        res.status(200).json({ message: 'Book deleted successfully' });
    });
}

