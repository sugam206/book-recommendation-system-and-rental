'use client'

import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/reduxToolkit/store';
import { fetchBooks, toggleFavoriteBook } from '@/app/reduxToolkit/slice';
import { useEffect } from 'react';
import BookGrid, { IBook } from '@/components/ui/bookGrid';

export default function Page() {
    const dispatch = useDispatch<AppDispatch>();
    const { books, loading } = useSelector((state: RootState) => state.books);

    useEffect(() => {
        dispatch(fetchBooks());
    }, [dispatch]);

    const favouriteBooks: IBook[] =
        books
            ?.filter((book) => book.isFavourite)
            .map((book) => ({
                ...book,
                genre: Array.isArray(book.genre) ? book.genre : (book.genre ? [book.genre] : []),
            })) ?? [];

    const handleToggleFavorite = async (bookId: string) => {
        await dispatch(toggleFavoriteBook(bookId));
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <BookGrid
                books={favouriteBooks}
                loading={loading}
                title="Your Favourite Books"
                emptyMessage="You haven't favorited any books yet."
                headerLink="/books"
                headerLinkText="See all books"
                onToggleFavorite={handleToggleFavorite}
            />
        </div>
    );
}