'use client'
import { useSelector, useDispatch } from "react-redux"
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
    const newest = [...books]
        .sort((a, b) => new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime()) as IBook[];

    return (
        <div className="p-6 max-w-6xl mx-auto">


            <BookGrid
                books={newest.map(b => ({
                    ...b,
                    genre: Array.isArray(b.genre) ? b.genre : (b.genre ? [b.genre] : undefined)
                }))}
                loading={loading}
                title="New Arrivals"
                emptyMessage="No new books available."
            />
        </div>
    )
}
