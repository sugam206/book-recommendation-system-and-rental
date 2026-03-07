'use client'

import BookGrid, { IBook } from "@/components/ui/bookGrid";
import { useSelector, useDispatch } from "react-redux"
import { RootState, AppDispatch } from "@/app/reduxToolkit/store"
import { useEffect, useState } from "react"
import axios from "axios";
import { toggleFavoriteBook } from "@/app/reduxToolkit/slice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (value?: string) => {
    if (!value) return "/file.svg";
    const normalized = value.replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${path}`;
};

export default function Page() {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    const { books } = useSelector((state: RootState) => state.books);
    const [recommendedBooks, setRecommendedBooks] = useState<IBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!token) {
                setRecommendedBooks([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                const response = await axios.get(`${API_BASE_URL}/api/recommendations`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = (response.data?.data || []) as any[];
                const favoriteSet = new Set(books.filter((b) => b.isFavourite).map((b) => b.id));
                const mapped: IBook[] = data.map((raw) => ({
                    id: String(raw._id ?? raw.id),
                    bookName: raw.title ?? raw.bookName,
                    authorName: raw.authorName,
                    image: resolveImageUrl(raw.image),
                    publishedDate: raw.publishedDate,
                    pages: raw.pages,
                    lastUpdatedDate: raw.lastUpdatedDate,
                    isFavourite: raw.isFavourite ?? favoriteSet.has(String(raw._id ?? raw.id)),
                    genre: Array.isArray(raw.genre) ? raw.genre : (raw.genre ? [raw.genre] : []),
                    averageRating: raw.averageRating,
                    ratingsCount: raw.ratingsCount,
                    description: raw.description,
                    tags: raw.tags ?? [],
                    readingStatus: null,
                }));
                setRecommendedBooks(mapped);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load recommendations");
                setRecommendedBooks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [token, books]);

    const handleToggleFavorite = async (bookId: string) => {
        setRecommendedBooks((prev) =>
            prev.map((item) =>
                item.id === bookId ? { ...item, isFavourite: !item.isFavourite } : item
            )
        );

        const result = await dispatch(toggleFavoriteBook(bookId));
        if (toggleFavoriteBook.rejected.match(result)) {
            setRecommendedBooks((prev) =>
                prev.map((item) =>
                    item.id === bookId ? { ...item, isFavourite: !item.isFavourite } : item
                )
            );
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Recommended for You</h1>
            {error && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}
            <BookGrid
                books={recommendedBooks}
                loading={loading}
                title="Recommended Books"
                emptyMessage="No recommended books available."
                onToggleFavorite={handleToggleFavorite}
            />
        </div>
    )
}
