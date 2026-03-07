import { Types } from "mongoose";
import asyncHandeler from "../middleware/asyncHandler.ts";
import type { Request, Response } from "express";
import { BookModel } from "../modules/books/book.model.ts";
import { RentModel } from "../modules/rent/rent.model.ts";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: "user" | "admin";
            };
        }
    }
}

export class RecommendationController {
    // GET /api/recommendations
    static getCollaborativeRecommendations = asyncHandeler(async (req: Request, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const userObjectId = new Types.ObjectId(userId);

        // 1) Books already rented by current user
        const userBookIds = await RentModel.find({
            userId: userObjectId,
            status: { $ne: "cancelled" }
        }).distinct("bookId");

        // Cold-start fallback: trending books from rentals
        if (userBookIds.length === 0) {
            const trending = await RentModel.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                {
                    $group: {
                        _id: "$bookId",
                        totalRents: { $sum: 1 }
                    }
                },
                { $sort: { totalRents: -1 } },
                { $limit: 10 }
            ]);

            const trendingBookIds = trending.map((t) => t._id);
            const books = await BookModel.find({ _id: { $in: trendingBookIds } }).lean();
            const order = new Map(trendingBookIds.map((id: Types.ObjectId, i: number) => [String(id), i]));
            books.sort((a, b) => (order.get(String(a._id)) ?? 9999) - (order.get(String(b._id)) ?? 9999));

            return res.status(200).json({
                success: true,
                reason: "trending_cold_start",
                data: books
            });
        }

        // 2) Users with overlap in rented books
        const similarUsers = await RentModel.find({
            bookId: { $in: userBookIds },
            userId: { $ne: userObjectId },
            status: { $ne: "cancelled" }
        }).distinct("userId");

        let recommendedBookIds: Types.ObjectId[] = [];

        // 3) Collaborative recommendations if similar users exist
        if (similarUsers.length > 0) {
            const recommended = await RentModel.aggregate([
                {
                    $match: {
                        userId: { $in: similarUsers },
                        bookId: { $nin: userBookIds },
                        status: { $ne: "cancelled" }
                    }
                },
                {
                    $group: {
                        _id: "$bookId",
                        score: { $sum: 1 }
                    }
                },
                { $sort: { score: -1 } },
                { $limit: 10 }
            ]);
            recommendedBookIds = recommended.map((r) => r._id);
        }

        // Fallback: latest books not already rented by user
        if (recommendedBookIds.length === 0) {
            const latest = await BookModel.find({ _id: { $nin: userBookIds } })
                .sort({ lastUpdatedDate: -1 })
                .limit(10)
                .select("_id")
                .lean();
            recommendedBookIds = latest.map((b) => b._id as Types.ObjectId);
        }

        const books = await BookModel.find({ _id: { $in: recommendedBookIds } }).lean();
        const order = new Map(recommendedBookIds.map((id: Types.ObjectId, i: number) => [String(id), i]));
        books.sort((a, b) => (order.get(String(a._id)) ?? 9999) - (order.get(String(b._id)) ?? 9999));

        return res.status(200).json({
            success: true,
            reason: similarUsers.length > 0 ? "collaborative" : "latest_fallback",
            data: books
        });
    });
}
