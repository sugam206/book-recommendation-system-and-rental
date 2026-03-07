'use client'
import { Metadata } from 'next'
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/reduxToolkit/store';
import { fetchBooks } from '@/app/reduxToolkit/slice';
import { useEffect } from 'react';
import BookGrid, { IBook } from '@/components/ui/bookGrid';



export default function Page() {
    const dispatch = useDispatch<AppDispatch>();
    const { books, loading } = useSelector((state: RootState) => state.books);
    useEffect(() => {
        dispatch(fetchBooks());
    }, [dispatch]);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">All Books</h1>
            <p className="text-sm text-gray-600 mb-4">Browse every book in our catalog.</p>

            <BookGrid
                books={books.map(b => ({
                    ...b,
                    genre: Array.isArray(b.genre) ? b.genre : [b.genre]
                }))}
                loading={loading}
                emptyMessage="No books available."
            />
        </div>
    )
}
