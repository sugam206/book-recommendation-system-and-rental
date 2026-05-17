'use client'

import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/reduxToolkit/store';
import { fetchBooks, toggleFavoriteBook } from '@/app/reduxToolkit/slice';
import { useEffect, useState } from 'react';
import BookGrid, { IBook } from '@/components/ui/bookGrid';

export default function Page() {
    const dispatch = useDispatch<AppDispatch>();
    const { books, loading } = useSelector((state: RootState) => state.books);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        dispatch(fetchBooks()); // Fetch all books to filter favorites
    }, [dispatch]);

    const favouriteBooks: IBook[] =
        books
            ?.filter((book) => book.isFavourite)
            .map((book) => ({
                ...book,
                genre: Array.isArray(book.genre) ? book.genre : (book.genre ? [book.genre] : []),
            })) ?? [];

    const totalPages = Math.ceil(favouriteBooks.length / limit);
    const displayBooks = favouriteBooks.slice((currentPage - 1) * limit, currentPage * limit);

    const handleToggleFavorite = async (bookId: string) => {
        await dispatch(toggleFavoriteBook(bookId));
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <BookGrid
                books={displayBooks}
                loading={loading}
                title="Your Favourite Books"
                emptyMessage="You haven't favorited any books yet."
                headerLink="/books"
                headerLinkText="See all books"
                onToggleFavorite={handleToggleFavorite}
            />
            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1 || loading}
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages || loading}
                        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}