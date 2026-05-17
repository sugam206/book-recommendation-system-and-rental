'use client'
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/reduxToolkit/store';
import { fetchBooks } from '@/app/reduxToolkit/slice';
import { useEffect, useState } from 'react';
import BookGrid from '@/components/ui/bookGrid';



export default function Page() {
    const dispatch = useDispatch<AppDispatch>();
    const { books, loading, pagination } = useSelector((state: RootState) => state.books);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(fetchBooks({ page: currentPage, limit: 10 }));
    }, [dispatch, currentPage]);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">All Books</h1>
            <p className="text-sm text-gray-600 mb-4">
                Browse every book in our catalog.
                {!loading && (
                    <span className="ml-1">
                        Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} books)
                    </span>
                )}
            </p>

            <BookGrid
                books={books.map(b => ({
                    ...b,
                    genre: Array.isArray(b.genre) ? b.genre : [b.genre]
                }))}
                loading={loading}
                emptyMessage="No books available."
            />

            {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1 || loading}
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
                        disabled={currentPage === pagination.totalPages || loading}
                        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
