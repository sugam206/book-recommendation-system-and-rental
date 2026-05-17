import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import fs from 'fs';

import { UserModel } from "../modules/user/user.model";
import { BookModel } from "../modules/books/book.model";
import asyncHandeler from "../middleware/asyncHandler";
import { Types } from "mongoose";

interface RentModel {
    userId: Types.ObjectId;
    bookId: Types.ObjectId;
    rentStartDate: Date;
    rentEndDate: Date;
    amount: number;
    status: 'payment_pending' | 'deposit_held' | 'provider_accepted' | 'refund_pending' | 'active' | 'completed' | 'refunded' | 'cancelled';
}



export class UserController {
    getProfile = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await UserModel.findById(req.user?.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user: user });
    });
    updateProfile = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // determine which user is being updated: self or specified by admin
        const targetId = req.params.id || req.user.id;

        // if not admin and trying to update someone else -> forbidden
        if (req.user.role !== 'admin' && targetId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { password, isAdmin, isVerified, ...safeUpdates } = req.body;

        // only admins may change role/rentalStatus or other protected fields
        if (req.user.role !== 'admin') {
            delete (safeUpdates as any).role;
            delete (safeUpdates as any).rentalStatus;
            delete (safeUpdates as any).isRenter;
        }

        const user = await UserModel.findByIdAndUpdate(targetId, safeUpdates, { new: true, runValidators: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user: user });
    });
    getAllUsers = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden ' });
        }
        const users = await UserModel.find().select({ password: 0 });
        res.status(200).json({ users: users });
    });
    deleteUser = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden you are not admin ' });

        }
        const users = await UserModel.findByIdAndDelete(req.params.id);
        if (!users) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    })
    getUserById = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const user = await UserModel.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user: user });
    });

    // toggle favourite book for current user
    toggleFavoriteBook = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const bookIdParam = req.params.bookId;
        const bookId = Array.isArray(bookIdParam) ? bookIdParam[0] : bookIdParam;

        if (!bookId || !Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid book id' });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const exists = user.savedBooks?.some((id: { toString: () => string; }) => id.toString() === bookId);
        if (exists) {
            user.savedBooks = (user.savedBooks || []).filter((id: { toString: () => string; }) => id.toString() !== bookId);
        } else {
            user.savedBooks = [...(user.savedBooks || []), new Types.ObjectId(bookId)];
        }
        await user.save();
        res.status(200).json({
            bookId,
            isFavourite: !exists,
            savedBooks: user.savedBooks,
        });
    });

    upsertMyBookStatus = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const bookIdParam = req.params.bookId;
        const bookId = Array.isArray(bookIdParam) ? bookIdParam[0] : bookIdParam;
        const { status } = req.body as { status?: 'want_to_read' | 'reading' | 'completed' };

        if (!bookId || !Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid book id' });
        }

        if (!status || !['want_to_read', 'reading', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use want_to_read, reading, or completed' });
        }

        const [user, book] = await Promise.all([
            UserModel.findById(req.user.id),
            BookModel.findById(bookId).select('_id')
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const now = new Date();
        const existingIndex = (user.readingList || []).findIndex(
            (entry: { bookId: Types.ObjectId }) => entry.bookId.toString() === bookId
        );

        if (existingIndex >= 0) {
            user.readingList![existingIndex].status = status;
            user.readingList![existingIndex].updatedAt = now;
        } else {
            user.readingList = [
                ...(user.readingList || []),
                {
                    bookId: new Types.ObjectId(bookId),
                    status,
                    addedAt: now,
                    updatedAt: now
                } as any
            ];
        }

        await user.save();

        const item = (user.readingList || []).find(
            (entry: { bookId: Types.ObjectId }) => entry.bookId.toString() === bookId
        );
        res.status(200).json({ success: true, item });
    });

    upsertBookRating = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const bookIdParam = req.params.bookId;
        const bookId = Array.isArray(bookIdParam) ? bookIdParam[0] : bookIdParam;
        const { rating } = req.body as { rating?: number };

        if (!bookId || !Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid book id' });
        }

        const numericRating = Number(rating);
        if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
        }

        const [user, book] = await Promise.all([
            UserModel.findById(req.user.id),
            BookModel.findById(bookId)
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const now = new Date();
        const currentCount = book.ratingsCount || 0;
        const currentAverage = book.averageRating || 0;

        const ratingEntries = user.bookRatings || [];
        const existingIndex = ratingEntries.findIndex(
            (entry: { bookId: Types.ObjectId }) => entry.bookId.toString() === bookId
        );

        let nextCount = currentCount;
        let nextAverage = currentAverage;

        if (existingIndex >= 0) {
            const previousRating = ratingEntries[existingIndex].rating;
            if (currentCount > 0) {
                nextAverage = ((currentAverage * currentCount) - previousRating + numericRating) / currentCount;
            } else {
                nextAverage = numericRating;
            }
            ratingEntries[existingIndex].rating = numericRating;
            ratingEntries[existingIndex].updatedAt = now;
        } else {
            nextCount = currentCount + 1;
            nextAverage = ((currentAverage * currentCount) + numericRating) / nextCount;
            ratingEntries.push({
                bookId: new Types.ObjectId(bookId),
                rating: numericRating,
                updatedAt: now
            } as any);
        }

        user.bookRatings = ratingEntries as any;
        book.ratingsCount = nextCount;
        book.averageRating = Math.round(nextAverage * 10) / 10;

        await Promise.all([user.save(), book.save()]);

        res.status(200).json({
            success: true,
            bookId,
            averageRating: book.averageRating,
            ratingsCount: book.ratingsCount,
            myRating: numericRating
        });
    });

    getMyBooksByStatus = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await UserModel.findById(req.user.id)
            .populate('readingList.bookId')
            .select('readingList');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const items = (user.readingList || [])
            .filter((entry: any) => entry.bookId)
            .map((entry: any) => ({
                book: entry.bookId,
                status: entry.status,
                addedAt: entry.addedAt,
                updatedAt: entry.updatedAt
            }));

        res.status(200).json({ success: true, items });
    });

    getMyRentedBooks = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { RentModel } = await import('../modules/rent/rent.model');

        const rents = await RentModel.find({ userId: req.user.id })
            .populate('bookId', 'title authorName image publishedDate pages')
            .populate('providerId', 'username email')
            .sort({ createdAt: -1 });

        const items = rents
            .filter((rent: any) => rent.bookId)
            .map((rent: any) => ({
                _id: rent._id,
                book: rent.bookId,
                provider: rent.providerId,
                requestedDays: rent.requestedDays,
                rentStartDate: rent.rentStartDate,
                rentEndDate: rent.rentEndDate,
                depositAmount: rent.depositAmount,
                paymentStatus: rent.paymentStatus,
                providerDecision: rent.providerDecision,
                adminDecision: rent.adminDecision,
                status: rent.status,
                createdAt: rent.createdAt,
                updatedAt: rent.updatedAt
            }));

        res.status(200).json({ success: true, items });
    });

    removeMyBook = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const bookIdParam = req.params.bookId;
        const bookId = Array.isArray(bookIdParam) ? bookIdParam[0] : bookIdParam;
        if (!bookId || !Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid book id' });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const before = (user.readingList || []).length;
        user.readingList = (user.readingList || []).filter(
            (entry: { bookId: Types.ObjectId }) => entry.bookId.toString() !== bookId
        ) as any;

        if ((user.readingList || []).length === before) {
            return res.status(404).json({ message: 'Book not found in your list' });
        }

        await user.save();
        res.status(200).json({ success: true, message: 'Book removed from your list' });
    });


    updateBasicInfo = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { username, email, preferredGenres, preferredAuthors, hasCompletedOnboarding } = req.body;
        const updates: any = {};


        if (username !== undefined) {
            if (typeof username !== 'string' || username.length < 3 || username.length > 30) {
                return res.status(400).json({ message: 'Username must be 3-30 characters' });
            }
            updates.username = username;
        }

        if (email !== undefined) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            const existingUser = await UserModel.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(409).json({ message: 'Email already in use' });
            }
            updates.email = email.toLowerCase();
        }

        if (preferredGenres !== undefined) {
            if (!Array.isArray(preferredGenres)) {
                return res.status(400).json({ message: 'Preferred genres must be an array' });
            }

            const sanitizedGenres = preferredGenres
                .map((genre) => typeof genre === 'string' ? genre.trim() : '')
                .filter(Boolean);

            if (sanitizedGenres.length === 0) {
                return res.status(400).json({ message: 'Select at least one genre' });
            }

            updates.preferredGenres = Array.from(new Set(sanitizedGenres));
        }

        if (preferredAuthors !== undefined) {
            if (!Array.isArray(preferredAuthors)) {
                return res.status(400).json({ message: 'Preferred authors must be an array' });
            }

            const sanitizedAuthors = preferredAuthors
                .map((author) => typeof author === 'string' ? author.trim() : '')
                .filter(Boolean);

            updates.preferredAuthors = Array.from(new Set(sanitizedAuthors));
        }

        if (hasCompletedOnboarding !== undefined) {
            updates.hasCompletedOnboarding = Boolean(hasCompletedOnboarding);
        }

        if (updates.preferredGenres && updates.preferredGenres.length > 0) {
            updates.hasCompletedOnboarding = true;
        }

        const user = await UserModel.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    });

    uploadProfilePicture = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }


        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.profilePicture) {
            try {
                fs.unlinkSync(user.profilePicture);
            } catch (err) {
                console.error('Error deleting old profile picture:', err);
            }
        }


        const picturePath = req.file.path.replace(/\\/g, '/'); // Normalize path for windows
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user.id,
            { profilePicture: picturePath },
            { new: true }
        ).select('-password');

        res.status(200).json({ success: true, picturePath, user: updatedUser });
    });

    deleteProfilePicture = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.profilePicture) {
            try {
                fs.unlinkSync(user.profilePicture);
            } catch (err) {
                console.error('Error deleting profile picture:', err);
            }
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user.id,
            { profilePicture: null },
            { new: true }
        ).select('-password');

        res.status(200).json({ success: true, user: updatedUser });
    });

    changePassword = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All password fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters' });
        }

        // Get user with password
        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(403).json({ message: 'Current password is incorrect' });
        }

        // Hash new password (mongoose pre-save hook will handle this)
        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    });

    enableRenterServices = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Toggle isRenter status
        user.isRenter = !user.isRenter;
        await user.save();

        res.status(200).json({ success: true, isRenter: user.isRenter, user: user.toObject({ transform: (_doc: any, ret: { password: any; }) => { delete ret.password; return ret; } }) });
    });

    getProfileStatistics = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await UserModel.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const memberSince = user.createdAt;

        const statistics = {
            memberSince,
            booksBorrowed: 0,
            booksLent: 0,
            totalEarnings: 0
        };

        res.status(200).json({ user, statistics });
    });

};
export default new UserController();
