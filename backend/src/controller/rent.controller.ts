import { RentModel } from "../modules/rent/rent.model";
import asyncHandeler from "../middleware/asyncHandler";
import type { Request, Response } from 'express';

import { Types } from "mongoose";
import { BookModel } from "../modules/books/book.model";
import { UserModel } from "../modules/user/user.model";
import { createNotifications } from "../service/notification.service";
import { createRazorpayOrder, getRazorpayConfig, verifyRazorpaySignature } from "../service/razorpay.service";

const REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;

const buildCheckoutReceipt = () => `rent_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const toSubunits = (amount: number) => Math.round(amount * 100);

export class RentController {
    createCheckoutOrder = asyncHandeler(async (req: Request, res: Response) => {
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
            UserModel.findById(req.user.id).select('role username email'),
            BookModel.findById(bookId)
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const requestedAt = new Date();
        const startDate = new Date(requestedAt);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + rentDays);
        const depositAmount = Number(book.price || 0);
        if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({ message: 'This book does not have a valid deposit amount' });
        }

        const order = await createRazorpayOrder({
            amount: toSubunits(depositAmount),
            currency: 'INR',
            receipt: buildCheckoutReceipt(),
            notes: {
                bookId: book._id.toString(),
                userId: req.user.id.toString(),
                requestedDays: String(rentDays)
            }
        });

        const rent = await RentModel.create({
            bookId: book._id,
            userId: req.user.id,
            providerId: null,
            requestedDays: rentDays,
            rentStartDate: startDate,
            rentEndDate: endDate,
            amount: depositAmount,
            depositAmount,
            paymentProvider: 'razorpay',
            paymentReference: order.id,
            paymentCurrency: order.currency,
            paymentAmountSubunits: order.amount,
            paymentStatus: 'pending',
            providerDecision: 'pending',
            adminDecision: 'pending',
            status: 'payment_pending'
        });

        const { keyId } = getRazorpayConfig();
        res.status(201).json({
            success: true,
            message: 'Razorpay checkout ready',
            key: keyId,
            rentId: rent._id,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            depositAmount,
            renter: {
                name: user.username,
                email: (user as any).email || ''
            },
            book: {
                id: book._id,
                title: book.title
            }
        });
    });

    verifyCheckoutPayment = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const currentUserId = req.user.id.toString();

        const {
            rentId,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body as {
            rentId?: string;
            razorpay_payment_id?: string;
            razorpay_order_id?: string;
            razorpay_signature?: string;
        };

        if (!rentId || !Types.ObjectId.isValid(rentId)) {
            return res.status(400).json({ message: 'Invalid rent ID' });
        }

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing Razorpay payment details' });
        }

        const rent = await RentModel.findOne({ _id: rentId, userId: req.user.id }).populate('bookId', 'title');
        if (!rent) {
            return res.status(404).json({ message: 'Rent request not found' });
        }

        if (rent.paymentStatus === 'held') {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified',
                rent
            });
        }

        if (rent.paymentStatus !== 'pending' || rent.status !== 'payment_pending') {
            return res.status(409).json({ message: 'This rent request can no longer be verified' });
        }

        if (rent.paymentReference !== razorpay_order_id) {
            return res.status(400).json({ message: 'Payment order does not match this rent request' });
        }

        const isSignatureValid = verifyRazorpaySignature({
            orderId: rent.paymentReference,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        });

        if (!isSignatureValid) {
            return res.status(400).json({ message: 'Razorpay payment verification failed' });
        }

        rent.paymentId = razorpay_payment_id;
        rent.paymentStatus = 'held';
        rent.status = 'deposit_held';
        rent.paymentVerifiedAt = new Date();
        await rent.save();

        const [verifiedUser, admins, approvedProviders] = await Promise.all([
            UserModel.findById(req.user.id).select('username'),
            UserModel.find({ role: 'admin' }).select('_id'),
            UserModel.find({ rentalStatus: 'approved' }).select('_id')
        ]);
        await createNotifications([
            ...approvedProviders
                .filter((provider) => provider._id.toString() !== currentUserId)
                .map((provider) => ({
                    userId: provider._id as Types.ObjectId,
                    title: 'New open rental request',
                    message: `${verifiedUser?.username || 'A user'} requested to rent "${(rent.bookId as any)?.title || 'a book'}". You can accept it from the rent section.`,
                    type: 'info' as const,
                    category: 'rent' as const,
                    rentId: rent._id as Types.ObjectId
                })),
            ...admins.map((admin) => ({
                userId: admin._id as Types.ObjectId,
                title: 'Deposit received for rental',
                message: `A Razorpay deposit was received for "${(rent.bookId as any)?.title || 'a book'}" and the request is now open for provider acceptance.`,
                type: 'info' as const,
                category: 'admin' as const,
                rentId: rent._id as Types.ObjectId
            }))
        ]);

        res.status(200).json({
            success: true,
            message: `Deposit of Rs. ${rent.depositAmount} received via Razorpay and published for rental providers.`,
            rent
        });
    });

    createRent = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { bookId, userId, providerId, rentStartDate, rentEndDate, amount } = req.body;
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

        let targetUserId: Types.ObjectId = new Types.ObjectId(req.user.id);

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
            providerId: providerId && Types.ObjectId.isValid(providerId) ? providerId : null,
            requestedDays: Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
            rentStartDate: startDate,
            rentEndDate: endDate,
            amount: numericAmount,
            depositAmount: numericAmount,
            paymentProvider: 'razorpay',
            paymentReference: buildCheckoutReceipt(),
            paymentStatus: 'held',
            providerDecision: providerId && Types.ObjectId.isValid(providerId) ? 'accepted' : 'pending',
            adminDecision: 'pending',
            status: providerId && Types.ObjectId.isValid(providerId) ? 'provider_accepted' : 'deposit_held'
        });
        res.status(201).json({ rent });
    });
    updateRent = asyncHandeler(async (req: Request, res: Response) => {
        return res.status(405).json({ message: 'Use provider/admin rental workflow endpoints instead of generic updates' });
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
            .populate('providerId', 'username email')
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
                .populate('providerId', 'username email')
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
    });

    getProviderRents = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const status = (req.query.status as string) || '';
        const provider = await UserModel.findById(req.user.id).select('rentalStatus');
        if (!provider || provider.rentalStatus !== 'approved') {
            return res.status(403).json({ message: 'Your rental provider account must be approved before you can view rent requests' });
        }

        const query: any = {
            $or: [
                { providerDecision: 'pending', providerId: null },
                { providerId: req.user.id }
            ]
        };
        if (status && status !== 'all') {
            query.status = status;
        }

        const rents = await RentModel.find(query)
            .populate('userId', 'username email')
            .populate('providerId', 'username email')
            .populate('bookId', 'title authorName price')
            .sort({ createdAt: -1 });

        res.status(200).json({ rents });
    });

    providerDecision = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { decision } = req.body as { decision?: 'accepted' | 'rejected' };
        if (!decision || !['accepted', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Decision must be accepted or rejected' });
        }

        const actingProvider = await UserModel.findById(req.user.id).select('rentalStatus role');
        if (!actingProvider) {
            return res.status(404).json({ message: 'User not found' });
        }

        const rent = await RentModel.findById(req.params.id).populate('bookId', 'title');
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        }

        const isProvider = rent.providerId?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === 'admin';
        const isApprovedProvider = actingProvider.rentalStatus === 'approved';
        if (!isApprovedProvider && !isAdmin) {
            return res.status(403).json({ message: 'Only approved rental providers or admins can review rent requests' });
        }

        if (rent.providerDecision !== 'pending') {
            return res.status(409).json({ message: 'Provider has already reviewed this request' });
        }

        const admins = await UserModel.find({ role: 'admin' }).select('_id');

        if (decision === 'accepted') {
            if (!isApprovedProvider) {
                return res.status(403).json({ message: 'Your rental provider account must be approved before you can accept requests' });
            }

            const acceptedRent = await RentModel.findOneAndUpdate(
                {
                    _id: rent._id,
                    providerDecision: 'pending',
                    $or: [
                        { providerId: null },
                        { providerId: req.user.id }
                    ]
                },
                {
                    $set: {
                        providerId: req.user.id,
                        providerDecision: 'accepted',
                        status: 'provider_accepted'
                    }
                },
                { new: true }
            ).populate('bookId', 'title');

            if (!acceptedRent) {
                return res.status(409).json({ message: 'This request was already accepted by another provider' });
            }

            await createNotifications([
                {
                    userId: acceptedRent.userId,
                    title: 'Rental accepted by provider',
                    message: `Your request for "${(acceptedRent.bookId as any)?.title || 'this book'}" was accepted and is now waiting for admin confirmation.`,
                    type: 'success',
                    category: 'rent',
                    rentId: acceptedRent._id as Types.ObjectId
                },
                ...admins.map((admin) => ({
                    userId: admin._id as Types.ObjectId,
                    title: 'Rental needs admin confirmation',
                    message: `Provider accepted a rental request and admin confirmation is now required.`,
                    type: 'warning' as const,
                    category: 'admin' as const,
                    rentId: acceptedRent._id as Types.ObjectId
                }))
            ]);

            return res.status(200).json({ success: true, message: 'Rental request accepted and assigned to you', rent: acceptedRent });
        }

        if (!isProvider && !isAdmin) {
            return res.status(403).json({ message: 'Only the provider assigned to this rent request or an admin can reject it' });
        }

        rent.providerDecision = 'rejected';
        rent.status = 'refund_pending';
        rent.paymentStatus = 'refund_pending';
        rent.refundDueAt = new Date(Date.now() + REFUND_WINDOW_MS);
        await rent.save();

        await createNotifications([
            {
                userId: rent.userId,
                title: 'Rental rejected by provider',
                message: `Your deposit is queued for refund and should be processed within 24 hours.`,
                type: 'warning',
                category: 'refund',
                rentId: rent._id as Types.ObjectId
            },
            ...admins.map((admin) => ({
                userId: admin._id as Types.ObjectId,
                title: 'Refund pending approval',
                message: `A rejected rental needs manual refund processing within 24 hours.`,
                type: 'warning' as const,
                category: 'refund' as const,
                rentId: rent._id as Types.ObjectId
            }))
        ]);

        res.status(200).json({ success: true, message: 'Rental request rejected and refund marked as pending', rent });
    });

    adminConfirmStart = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const rent = await RentModel.findById(req.params.id).populate('bookId', 'title');
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        }

        if (rent.providerDecision !== 'accepted') {
            return res.status(409).json({ message: 'Provider must accept the request before admin confirmation' });
        }

        rent.adminDecision = 'confirmed_start';
        rent.status = 'active';
        rent.rentStartDate = new Date();
        const recalculatedEndDate = new Date(rent.rentStartDate);
        recalculatedEndDate.setDate(recalculatedEndDate.getDate() + rent.requestedDays);
        rent.rentEndDate = recalculatedEndDate;
        await rent.save();

        await createNotifications([
            {
                userId: rent.userId,
                title: 'Rental started',
                message: `Admin confirmed your rental. Your rental period is now active.`,
                type: 'success',
                category: 'rent',
                rentId: rent._id as Types.ObjectId
            },
            {
                userId: rent.providerId,
                title: 'Rental handoff confirmed',
                message: `Admin confirmed the rental handoff for "${(rent.bookId as any)?.title || 'this book'}".`,
                type: 'success',
                category: 'rent',
                rentId: rent._id as Types.ObjectId
            }
        ]);

        res.status(200).json({ success: true, message: 'Rental activated successfully', rent });
    });

    adminConfirmCompletion = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const rent = await RentModel.findById(req.params.id).populate('bookId', 'title');
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        }

        if (rent.status !== 'active') {
            return res.status(409).json({ message: 'Only active rentals can be completed' });
        }

        if (rent.rentEndDate.getTime() > Date.now()) {
            return res.status(409).json({ message: 'Rental period is not over yet' });
        }

        rent.adminDecision = 'confirmed_completion';
        rent.status = 'completed';
        rent.paymentStatus = 'released';
        rent.releasedAt = new Date();
        await rent.save();

        await createNotifications([
            {
                userId: rent.providerId,
                title: 'Deposit released',
                message: `Admin released Rs. ${rent.depositAmount} to you after rental completion.`,
                type: 'success',
                category: 'payment',
                rentId: rent._id as Types.ObjectId
            },
            {
                userId: rent.userId,
                title: 'Rental completed',
                message: `Your rental has been completed and the held deposit was released to the provider.`,
                type: 'info',
                category: 'rent',
                rentId: rent._id as Types.ObjectId
            }
        ]);

        res.status(200).json({ success: true, message: 'Rental completed and deposit released', rent });
    });

    adminRefundDeposit = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const rent = await RentModel.findById(req.params.id).populate('bookId', 'title');
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found' });
        }

        if (rent.paymentStatus !== 'refund_pending') {
            return res.status(409).json({ message: 'This rental is not waiting for a refund' });
        }

        rent.adminDecision = 'refund_processed';
        rent.paymentStatus = 'refunded';
        rent.status = 'refunded';
        rent.refundedAt = new Date();
        await rent.save();

        await createNotifications([
            {
                userId: rent.userId,
                title: 'Deposit refunded',
                message: `Admin processed your refund for "${(rent.bookId as any)?.title || 'this book'}".`,
                type: 'success',
                category: 'refund',
                rentId: rent._id as Types.ObjectId
            },
            {
                userId: rent.providerId,
                title: 'Refund completed',
                message: `The rejected rental request has been refunded to the renter.`,
                type: 'info',
                category: 'refund',
                rentId: rent._id as Types.ObjectId
            }
        ]);

        res.status(200).json({ success: true, message: 'Refund processed successfully', rent });
    });

};
