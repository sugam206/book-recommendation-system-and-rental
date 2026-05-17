import asyncHandeler from "../middleware/asyncHandler";
import type { Request, Response } from "express";
import { getRecommendations } from "../service/recommendation/hybrid";
import { UserModel } from "../modules/user/user.model";
import { Types } from "mongoose";

export class RecommendationController {

    static getCollaborativeRecommendations = asyncHandeler(async (req: Request, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const limit = parseInt(req.query.limit as string) || 10;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await getRecommendations(userId, limit, offset) as unknown as { reason: string; books: unknown[] };

        // Add isFavourite flag based on user's saved books
        const user = await UserModel.findById(userId).select('savedBooks readingList');
        const favSet = new Set(user?.savedBooks?.map((id: Types.ObjectId) => id.toString()) || []);
        const readingMap = new Map(
            (user?.readingList || []).map((entry: any) => [entry.bookId.toString(), entry.status])
        );

        const booksWithFavorites = result.books.map((book: any) => ({
            ...book,
            isFavourite: favSet.has(book._id?.toString() || book.id),
            readingStatus: readingMap.get(book._id?.toString() || book.id) || null
        }));

        return res.status(200).json({
            success: true,
            reason: result.reason,
            data: booksWithFavorites
        });
    });
}