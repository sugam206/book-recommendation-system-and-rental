'use client'
import { useSelector, useDispatch } from "react-redux"
import { RootState, AppDispatch } from "@/app/reduxToolkit/store"
import { fetchBooks } from "@/app/reduxToolkit/slice"
import { useEffect, useState } from "react"
import BookGrid, { IBook } from '@/components/ui/bookGrid';

export default function Page() {
    const dispatch = useDispatch<AppDispatch>();
    const { books, loading } = useSelector((state: RootState) => state.books);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        dispatch(fetchBooks()); // Fetch all books to sort by newest
    }, [dispatch]);

    const newest = [...books]
        .sort((a, b) => new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime()) as IBook[];

    const totalPages = Math.ceil(newest.length / limit);
    const displayBooks = newest.slice((currentPage - 1) * limit, currentPage * limit).map(b => ({
        ...b,
        genre: Array.isArray(b.genre) ? b.genre : (b.genre ? [b.genre] : undefined)
    }));

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <BookGrid
                books={displayBooks}
                loading={loading}
                title="New Arrivals"
                emptyMessage="No new books available."
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
    )
}
