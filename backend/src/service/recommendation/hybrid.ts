import { Types } from "mongoose";
import { BookModel } from "../../modules/books/book.model";
import { RentModel } from "../../modules/rent/rent.model";
import { UserModel } from "../../modules/user/user.model";

type RecommendationResult = {
    reason: string;
    books: unknown[];
};

type ScoredBook = {
    _id: Types.ObjectId;
    score: number;
};

type UserBookRating = {
    bookId: Types.ObjectId;
    rating: number;
};

type UserReadingListEntry = {
    bookId: Types.ObjectId;
    status: "want_to_read" | "reading" | "completed";
};

const addScore = (scoreMap: Map<string, number>, bookId: Types.ObjectId | string, value: number) => {
    const key = bookId.toString();
    scoreMap.set(key, (scoreMap.get(key) || 0) + value);
};

const attachAvailability = async (rankedBookIds: Types.ObjectId[]) => {
    if (rankedBookIds.length === 0) {
        return [];
    }

    const [books, unavailableBookIds] = await Promise.all([
        BookModel.find({ _id: { $in: rankedBookIds } }).lean(),
        RentModel.find({
            bookId: { $in: rankedBookIds },
            status: { $in: ["pending", "active"] }
        }).distinct("bookId")
    ]);

    const unavailableSet = new Set(
        unavailableBookIds.map((bookId: Types.ObjectId) => bookId.toString())
    );

    return rankedBookIds
        .map((bookId) => books.find((book) => book._id?.toString() === bookId.toString()))
        .filter(Boolean)
        .map((book) => ({
            ...book,
            isAvailableForRent: !unavailableSet.has(book._id.toString())
        }));
};

const buildPreferenceRecommendations = async (
    preferredGenres: string[],
    preferredAuthors: string[],
    excludedBookIds: Types.ObjectId[],
    limit: number,
    offset: number
) => {
    if (preferredGenres.length === 0 && preferredAuthors.length === 0) {
        return [];
    }

    const preferenceCandidates = await BookModel.find({
        _id: { $nin: excludedBookIds },
        $or: [
            { genre: { $in: preferredGenres } },
            { authorName: { $in: preferredAuthors } }
        ]
    })
        .select("_id genre authorName averageRating ratingsCount")
        .limit(limit * 4)
        .lean();

    const scoreMap = new Map<string, number>();

    preferenceCandidates.forEach((book) => {
        let score = 0;

        score += (book.genre || []).filter((genre: string) => preferredGenres.includes(genre)).length * 2;

        if (book.authorName && preferredAuthors.includes(book.authorName)) {
            score += 3;
        }

        score += (book.averageRating || 0) * 0.5;
        score += Math.min((book.ratingsCount || 0) / 50, 2);

        if (score > 0) {
            addScore(scoreMap, book._id as Types.ObjectId, score);
        }
    });

    return Array.from(scoreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(offset, offset + limit)
        .map(([bookId]) => new Types.ObjectId(bookId));
};

const buildCatalogFallback = async (
    excludedBookIds: Types.ObjectId[],
    limit: number,
    offset: number
) => {
    const books = await BookModel.find({
        _id: { $nin: excludedBookIds }
    })
        .select("_id")
        .sort({ averageRating: -1, ratingsCount: -1, lastUpdatedDate: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

    return books.map((book) => book._id as Types.ObjectId);
};

export const getRecommendations = async (
    userId: string,
    limit = 10,
    offset = 0
): Promise<RecommendationResult> => {
    const userObjectId = new Types.ObjectId(userId);

    const [user, rentedBookIds] = await Promise.all([
        UserModel.findById(userObjectId)
            .select("savedBooks isFavourite bookRatings readingList preferredGenres preferredAuthors")
            .lean(),
        RentModel.find({
            userId: userObjectId,
            status: { $ne: "cancelled" }
        }).distinct("bookId")
    ]);

    const favoriteBookIds = [
        ...(user?.savedBooks || []),
        ...(user?.isFavourite ? [user.isFavourite] : [])
    ];

    const highlyRatedBookIds = (user?.bookRatings || [])
        .filter((entry: UserBookRating) => entry.rating >= 4)
        .map((entry: UserBookRating) => entry.bookId);

    const readingListBookIds = (user?.readingList || [])
        .filter((entry: UserReadingListEntry) => entry.status === "reading" || entry.status === "completed")
        .map((entry: UserReadingListEntry) => entry.bookId);

    const interactionSeedIds = [
        ...rentedBookIds,
        ...favoriteBookIds,
        ...highlyRatedBookIds,
        ...readingListBookIds
    ];

    const uniqueSeedIds = Array.from(
        new Set(interactionSeedIds.map((bookId) => bookId.toString()))
    ).map((bookId) => new Types.ObjectId(bookId));

    const preferredGenres = user?.preferredGenres || [];
    const preferredAuthors = user?.preferredAuthors || [];

    if (uniqueSeedIds.length === 0) {
        let bookIds: Types.ObjectId[] = [];
        let trending: ScoredBook[] = [];  // Declare here

        // 1. Start with preference-based recommendations
        if (preferredGenres.length > 0 || preferredAuthors.length > 0) {
            const preferenceBookIds = await buildPreferenceRecommendations(
                preferredGenres,
                preferredAuthors,
                [],
                limit,
                offset
            );
            bookIds = preferenceBookIds;
        }

        // 2. Supplement with trending books if needed
        if (bookIds.length < limit) {
            trending = await RentModel.aggregate<ScoredBook>([  // Assign here
                { $match: { status: { $ne: "cancelled" } } },
                {
                    $group: {
                        _id: "$bookId",
                        score: { $sum: 1 }
                    }
                },
                { $sort: { score: -1 } },
                { $limit: limit - bookIds.length }
            ]);
            const trendingIds = trending.map((entry) => entry._id);
            bookIds = [...bookIds, ...trendingIds];
        }

        // 3. Fill remaining slots with catalog books
        if (bookIds.length < limit) {
            const catalogIds = await buildCatalogFallback([], limit - bookIds.length, offset);
            bookIds = [...bookIds, ...catalogIds];
        }

        // Ensure we don't exceed the limit
        bookIds = bookIds.slice(0, limit);

        const books = await attachAvailability(bookIds);

        // Determine the reason based on what was used
        let reason = "catalog_cold_start";
        if (preferredGenres.length > 0 || preferredAuthors.length > 0) {
            reason = "onboarding_preferences"; // Even if supplemented
        } else if (trending.length > 0) {
            reason = "trending_cold_start";
        }

        return {
            reason,
            books
        };
    }

    const similarUsers = await RentModel.find({
        bookId: { $in: uniqueSeedIds },
        userId: { $ne: userObjectId },
        status: { $ne: "cancelled" }
    }).distinct("userId");

    const scoreMap = new Map<string, number>();
    const seenBookIds = new Set(uniqueSeedIds.map((bookId) => bookId.toString()));

    if (similarUsers.length > 0) {
        const collaborativeRecommendations = await RentModel.aggregate<ScoredBook>([
            {
                $match: {
                    userId: { $in: similarUsers },
                    bookId: { $nin: uniqueSeedIds },
                    status: { $ne: "cancelled" }
                }
            },
            {
                $group: {
                    _id: "$bookId",
                    score: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 3, 1]
                        }
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: limit * 3 }
        ]);

        collaborativeRecommendations.forEach((entry) => {
            addScore(scoreMap, entry._id, entry.score);
        });
    }

    if (favoriteBookIds.length > 0) {
        const favoriteBooks = await BookModel.find({
            _id: { $in: favoriteBookIds }
        })
            .select("genre tags authorName")
            .lean();

        const genres = new Set(
            favoriteBooks.flatMap((book) => book.genre || []).filter(Boolean)
        );
        const tags = new Set(
            favoriteBooks.flatMap((book) => book.tags || []).filter(Boolean)
        );
        const authors = new Set(
            favoriteBooks.map((book) => book.authorName).filter(Boolean)
        );

        if (genres.size > 0 || tags.size > 0 || authors.size > 0) {
            const contentCandidates = await BookModel.find({
                _id: { $nin: uniqueSeedIds },
                $or: [
                    { genre: { $in: Array.from(genres) } },
                    { tags: { $in: Array.from(tags) } },
                    { authorName: { $in: Array.from(authors) } }
                ]
            })
                .select("_id genre tags authorName averageRating ratingsCount")
                .limit(limit * 4)
                .lean();

            contentCandidates.forEach((book) => {
                let score = 0;

                score += (book.genre || []).filter((genre: string) => genres.has(genre)).length * 2;
                score += (book.tags || []).filter((tag: string) => tags.has(tag)).length;

                if (book.authorName && authors.has(book.authorName)) {
                    score += 3;
                }

                score += (book.averageRating || 0) * 0.5;
                score += Math.min((book.ratingsCount || 0) / 50, 2);

                if (score > 0) {
                    addScore(scoreMap, book._id as Types.ObjectId, score);
                }
            });
        }
    }

    let rankedBookIds = Array.from(scoreMap.entries())
        .filter(([bookId]) => !seenBookIds.has(bookId))
        .sort((a, b) => b[1] - a[1])
        .slice(offset, offset + limit)
        .map(([bookId]) => new Types.ObjectId(bookId));

    let reason = "hybrid";

    if (rankedBookIds.length === 0) {
        const fallback = await RentModel.aggregate<ScoredBook>([
            {
                $match: {
                    bookId: { $nin: uniqueSeedIds },
                    status: { $ne: "cancelled" }
                }
            },
            {
                $group: {
                    _id: "$bookId",
                    score: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 2, 1]
                        }
                    }
                }
            },
            { $sort: { score: -1 } },
            { $skip: offset },
            { $limit: limit }
        ]);

        rankedBookIds = fallback.map((entry) => entry._id);
        if (rankedBookIds.length === 0) {
            rankedBookIds = await buildCatalogFallback(uniqueSeedIds, limit, offset);
            reason = "catalog_fallback";
        } else {
            reason = favoriteBookIds.length > 0 ? "favorites_fallback" : "latest_fallback";
        }
    }

    const orderedBooks = await attachAvailability(rankedBookIds);

    return {
        reason,
        books: orderedBooks
    };
};
