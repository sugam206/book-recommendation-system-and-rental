import express from 'express';
import type { Request, Response } from 'express';
import { RentalRequestModel } from '../modules/rentalRequest/rentalRequest.model';
import { UserModel } from '../modules/user/user.model';
import asyncHandeler from '../middleware/asyncHandler';
import { Types } from 'mongoose';

export class RentalRequestController {
    // User: Submit a rental service request
    submitRentalRequest = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { businessName, businessDescription, experienceLevel, rentalTermsPreference } = req.body;

        // Validate input
        if (!businessName || !businessDescription || !experienceLevel || !rentalTermsPreference) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!['beginner', 'intermediate', 'expert'].includes(experienceLevel)) {
            return res.status(400).json({ message: 'Invalid experience level' });
        }

        // Check if user has profile picture
        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.profilePicture) {
            return res.status(400).json({ message: 'Please upload a profile picture before requesting rental services' });
        }

        // Check if user already has pending request
        const existingPendingRequest = await RentalRequestModel.findOne({
            userId: req.user.id,
            status: 'pending'
        });

        if (existingPendingRequest) {
            return res.status(409).json({ message: 'You already have a pending rental request. Please wait for admin review.' });
        }

        // Create new rental request
        const rentalRequest = new RentalRequestModel({
            userId: req.user.id,
            businessName,
            businessDescription,
            experienceLevel,
            rentalTermsPreference,
            status: 'pending',
            requestDate: new Date()
        });

        await rentalRequest.save();

        // Update user rental status to pending
        user.rentalStatus = 'pending';
        user.currentRentalRequestId = rentalRequest._id as Types.ObjectId;
        await user.save();

        res.status(201).json({ success: true, request: rentalRequest });
    });

    // User: Get current rental request status
    getCurrentRentalRequest = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const request = await RentalRequestModel.findOne({
            userId: req.user.id,
            status: { $in: ['pending', 'approved', 'rejected'] }
        }).sort({ requestDate: -1 }).limit(1);

        const user = await UserModel.findById(req.user.id);

        res.status(200).json({
            request,
            status: user?.rentalStatus || 'inactive',
            message: request ? 'Request found' : 'No active request'
        });
    });

    // User: Check if can rent
    canUserRent = asyncHandeler(async (req: Request, res: Response) => {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const canRent = true;
        const reason = undefined;

        res.status(200).json({ canRent, reason });
    });

    // Admin: Get all rental requests with filtering
    getAllRentalRequests = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const status = req.query.status as string || 'pending';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const requests = await RentalRequestModel.find({ status })
            .populate('userId', 'username email profilePicture')
            .populate('reviewedBy', 'username')
            .sort({ requestDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await RentalRequestModel.countDocuments({ status });

        res.status(200).json({
            success: true,
            requests,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    });

    // Admin: Get specific rental request details
    getRentalRequestDetails = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const request = await RentalRequestModel.findById(req.params.requestId)
            .populate('userId', '-password')
            .populate('reviewedBy', 'username');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.status(200).json({ success: true, request });
    });

    // Admin: Approve rental request
    approveRentalRequest = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { adminNotes } = req.body;
        const request = await RentalRequestModel.findById(req.params.requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Update request
        request.status = 'approved';
        request.reviewedDate = new Date();
        request.reviewedBy = new Types.ObjectId(req.user.id);
        request.adminNotes = adminNotes || '';
        await request.save();

        // Update user
        const user = await UserModel.findByIdAndUpdate(
            request.userId,
            {
                rentalStatus: 'approved',
                rentalApprovedDate: new Date()
            },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Request approved',
            request,
            user
        });
    });

    // Admin: Reject rental request
    rejectRentalRequest = asyncHandeler(async (req: Request, res: Response) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { adminNotes } = req.body;

        if (!adminNotes) {
            return res.status(400).json({ message: 'Admin notes are required for rejection' });
        }

        const request = await RentalRequestModel.findById(req.params.requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Update request
        request.status = 'rejected';
        request.reviewedDate = new Date();
        request.reviewedBy = new Types.ObjectId(req.user.id);
        request.adminNotes = adminNotes;
        await request.save();

        // Update user
        const user = await UserModel.findByIdAndUpdate(
            request.userId,
            {
                rentalStatus: 'rejected'
            },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Request rejected',
            request,
            user
        });
    });
}

export default new RentalRequestController();
