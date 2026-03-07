import { RentModel } from "../modules/rent/rent.model.ts";
import asyncHandeler from "../middleware/asyncHandler.ts";
import type { Request, Response } from 'express';

import { Types } from "mongoose";
import { BookModel } from "../modules/books/book.model.ts";
import { UserModel } from "../modules/user/user.model.ts";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: Types.ObjectId;
                role: 'user' | 'admin';
            }
        }
    }
}
export class RentController {
    createRentRequest = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { bookId, days } = req.body as { bookId?: string; days?: number };
        if (!bookId || !Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid book ID' });
        }

        const rentDays = Number(days);
        if (!Number.isFinite(rentDays) || rentDays < 1 || rentDays > 60) {
            return res.status(400).json({ message: 'Days must be between 1 and 60' });
        }

        const [user, book] = await Promise.all([
            UserModel.findById(req.user.id).select('rentalStatus role'),
            BookModel.findById(bookId)
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.ownerId && book.ownerId.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'You cannot rent your own book' });
        }

        const canRent = user.role === 'admin' || user.rentalStatus === 'approved';
        if (!canRent) {
            return res.status(403).json({ message: 'Your rental service must be approved before renting books' });
        }

        const existingActiveOrPending = await RentModel.findOne({
            bookId: book._id,
            status: { $in: ['pending', 'active'] }
        }).select('_id');

        if (existingActiveOrPending) {
            return res.status(409).json({ message: 'This book is currently not available for rent' });
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + rentDays);

        const DAILY_RATE = 2;
        const amount = rentDays * DAILY_RATE;

        const rent = await RentModel.create({
            bookId: book._id,
            userId: req.user.id,
            rentStartDate: startDate,
            rentEndDate: endDate,
            amount,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: `Rent request submitted for ${rentDays} day(s)`,
            rent
        });
    });

    createRent = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { bookId, userId, rentStartDate, rentEndDate, amount } = req.body;
        if (!Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid book ID' });
        }

        const startDate = new Date(rentStartDate);
        const endDate = new Date(rentEndDate);
        const numericAmount = Number(amount);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Invalid rent dates' });
        }

        if (endDate < startDate) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        const book = await BookModel.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        let targetUserId: Types.ObjectId = req.user.id;

        if (req.user.role === 'admin' && userId) {
            if (!Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            targetUserId = user._id as Types.ObjectId;
        }

        const rent = await RentModel.create({
            bookId,
            userId: targetUserId,
            rentStartDate: startDate,
            rentEndDate: endDate,
            amount: numericAmount,
            status: 'pending'
        });
        res.status(201).json({ rent });
    });
    updateRent = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const rent = await RentModel.findById(req.params.id);
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        }
        const updatedRent = await RentModel.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        );
        res.status(200).json({ rent: updatedRent });
    });
    deleteRent = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const rent = await RentModel.findByIdAndDelete(req.params.id);
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        }
        res.status(200).json({ message: 'Rent deleted successfully' });
    });

    // ─── GET /:id ─────────────────────────────────────────────────────────────
    getRentById = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const rent = await RentModel.findById(req.params.id)
            .populate('userId', 'username email')
            .populate('bookId', 'title authorName');
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        }
        res.status(200).json({ rent });
    })

    // ─── GET / ────────────────────────────────────────────────────────────────
    getAllRents = asyncHandeler(async (req: Request, res: Response) => {
        // only admins can query all rentals
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const status = (req.query.status as string) || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const [rents, total] = await Promise.all([
            RentModel.find(query)
                .populate('userId', 'username email')
                .populate('bookId', 'title authorName')
                .sort({ rentStartDate: -1 })
                .skip(skip)
                .limit(limit),
            RentModel.countDocuments(query),
        ]);

        res.status(200).json({
            rents,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    })

};
