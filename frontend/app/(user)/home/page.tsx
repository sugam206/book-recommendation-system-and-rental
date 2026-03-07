'use client'
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/reduxToolkit/store';
import { fetchBooks, toggleFavoriteBook } from '@/app/reduxToolkit/slice';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BookGrid, { IBook } from '@/components/ui/bookGrid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (value?: string) => {
    if (!value) return "/file.svg";
    const normalized = value.replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${path}`;
};

export default function Home() {
    const dispatch = useDispatch<AppDispatch>();
    const { books, loading } = useSelector((state: RootState) => state.books);
    const { token } = useSelector((state: RootState) => state.auth);
    const [recommendedBooks, setRecommendedBooks] = useState<IBook[]>([]);
    const [recommendationLoading, setRecommendationLoading] = useState(true);

    useEffect(() => {
        dispatch(fetchBooks());
    }, [dispatch]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!token) {
                setRecommendedBooks([]);
                setRecommendationLoading(false);
                return;
            }

            try {
                setRecommendationLoading(true);
                const response = await axios.get(`${API_BASE_URL}/api/recommendations`, {
                    headers: { Authorization: `Bearer ${token}` }
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
            } catch {
                setRecommendedBooks([]);
            } finally {
                setRecommendationLoading(false);
            }
        };

        fetchRecommendations();
    }, [token, books]);

    const handleToggleFavoriteInRecommendations = async (bookId: string) => {
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

    const favouriteBooks = books?.filter(book => book.isFavourite).map(book => ({
        ...book,
        genre: Array.isArray(book.genre) ? book.genre : [book.genre]
    })) ?? [];

    return (
        <main className="py-6 px-10 min-h-screen">
            <BookGrid
                books={recommendedBooks}
                loading={recommendationLoading}
                title="Recommended for You"
                emptyMessage="No recommendations available yet."
                headerLink="/browse/recommendation"
                headerLinkText="See all recommendations"
                onToggleFavorite={handleToggleFavoriteInRecommendations}
            />

            <BookGrid
                books={favouriteBooks}
                loading={loading}
                title="Your Favourite Books"
                emptyMessage="You haven't favorited any books yet."
                headerLink="/browse/favouriteBooks"
                headerLinkText="See all books"
            />
        </main>
    );
}
