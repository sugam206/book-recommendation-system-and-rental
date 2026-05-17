'use client'
import { useDispatch, useSelector } from "react-redux"
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
        dispatch(fetchBooks());
    }, [dispatch]);

    const fictionBooks = books.filter(book => {
        const genre = Array.isArray(book.genre) ? book.genre[0] : book.genre;
        return genre?.toLowerCase() === 'fiction';
    }) as IBook[];

    const totalPages = Math.ceil(fictionBooks.length / limit);
    const displayBooks = fictionBooks.slice((currentPage - 1) * limit, currentPage * limit).map(b => ({
        ...b,
        genre: Array.isArray(b.genre) ? b.genre : [b.genre]
    }));

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <BookGrid
                books={displayBooks}
                loading={loading}
                title="Fiction Books"
                emptyMessage="No fiction books found."
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
