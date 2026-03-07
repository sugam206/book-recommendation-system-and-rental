'use client'
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/app/reduxToolkit/store"
import { fetchBooks } from "@/app/reduxToolkit/slice"
import { useEffect } from "react"
import BookGrid, { IBook } from '@/components/ui/bookGrid';


export default function Page() {
    const dispatch = useDispatch<AppDispatch>();
    const { books, loading } = useSelector((state: RootState) => state.books);
    useEffect(() => {
        dispatch(fetchBooks());
    }, [dispatch]);
    const scienceBooks = books.filter(book => {
        const genre = Array.isArray(book.genre) ? book.genre[0] : book.genre;
        return genre?.toLowerCase() === 'science';
    }) as IBook[];

    return (
        <div className="p-6 max-w-6xl mx-auto">


            <BookGrid
                books={scienceBooks.map(b => ({
                    ...b,
                    genre: Array.isArray(b.genre) ? b.genre.filter((g): g is string => g !== undefined) : b.genre ? [b.genre] : undefined
                }))}
                loading={loading}
                title="Science Books"
                emptyMessage="No science books found."
            />
        </div>
    )
}
