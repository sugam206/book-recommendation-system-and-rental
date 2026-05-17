"use client";

import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/app/reduxToolkit/store";
import type { RootState } from "@/app/reduxToolkit/store";
import { toggleFavoriteBook, upsertMyBookStatus } from "@/app/reduxToolkit/slice";

export interface IBook {
    id: string;
    rentalProviderId?: string;
    bookName: string;
    authorName: string;
    image: string;
    publishedDate: string;
    pages: number;
    lastUpdatedDate: string;
    isFavourite: boolean;
    genre?: string[];
    averageRating?: number;
    ratingsCount?: number;
    description?: string;
    tags?: string[];
    readingStatus?: "want_to_read" | "reading" | "completed" | null;
    isAvailableForRent?: boolean;
    availabilityStatus?: "available" | "pending_provider_review" | "awaiting_admin_confirmation" | "refund_in_progress" | "rented_out";
    availabilityMessage?: string;
}

interface BookGridProps {
    books?: IBook[];
    loading?: boolean;
    title?: string;
    headerLink?: string;
    headerLinkText?: string;
    emptyMessage?: string;
    limit?: number;
    onToggleFavorite?: (bookId: string) => void;
    onAddToMyBooks?: (bookId: string, status: "want_to_read" | "reading" | "completed") => void;
}

const formatDate = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
};

function StarRating({ rating, count }: { rating?: number; count?: number }) {
    if (!rating) return null;
    const stars = Math.round(rating);
    return (
        <div className="mt-1 flex items-center gap-1.5">
            <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < stars ? "text-amber-400" : "text-gray-200"}`}>
                        *
                    </span>
                ))}
            </div>
            {count !== undefined && <span className="text-[11px] text-gray-400">({count})</span>}
        </div>
    );
}

const readingLabel = (status?: "want_to_read" | "reading" | "completed" | null) => {
    if (status === "want_to_read") return "Want to Read";
    if (status === "reading") return "Reading";
    if (status === "completed") return "Completed";
    return "Add to My Books";
};

function BookCard({
    item,
    onToggleFavorite,
    onAddToMyBooks,
}: {
    item: IBook;
    onToggleFavorite?: (bookId: string) => void;
    onAddToMyBooks?: (bookId: string, status: "want_to_read" | "reading" | "completed") => void;
}) {
    const dispatch = useDispatch<AppDispatch>();

    const handleFavorite = () => {
        if (onToggleFavorite) {
            onToggleFavorite(item.id);
            return;
        }
        dispatch(toggleFavoriteBook(item.id));
    };

    const handleAddToMyBooks = (status: "want_to_read" | "reading" | "completed") => {
        if (onAddToMyBooks) {
            onAddToMyBooks(item.id, status);
            return;
        }
        dispatch(upsertMyBookStatus({ bookId: item.id, status }));
    };

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <Link href={`/books/${item.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                    <img
                        src={item.image}
                        alt={`${item.bookName} cover`}
                        onError={(e) => {
                            const img = e.currentTarget;
                            img.onerror = null;
                            img.src = "/file.svg";
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="rounded-full border border-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                            View Book
                        </span>
                    </div>
                    {item.genre?.[0] && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            {item.genre[0]}
                        </span>
                    )}
                </div>
            </Link>

            <button
                onClick={handleFavorite}
                aria-label={item.isFavourite ? "Remove from favourites" : "Add to favourites"}
                className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 hover:scale-110 ${item.isFavourite ? "bg-rose-50 text-rose-500" : "bg-white/90 text-gray-300 hover:text-rose-400"
                    }`}
            >
                <svg viewBox="0 0 24 24" fill={item.isFavourite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            </button>

            <div className="flex flex-1 flex-col gap-1 p-3.5">
                <Link href={`/books/${item.id}`}>
                    <h3 className="line-clamp-2 font-serif text-[0.95rem] font-bold leading-snug text-stone-900 transition-colors hover:text-amber-700">
                        {item.bookName}
                    </h3>
                </Link>
                <p className="text-[0.75rem] italic text-stone-500">by {item.authorName}</p>
                <StarRating rating={item.averageRating} count={item.ratingsCount} />
                <div className="mt-1.5 flex items-center gap-1.5 text-[0.68rem] text-stone-400">
                    <span>{item.pages} pages</span>
                    <span className="opacity-40">|</span>
                    <span>{formatDate(item.publishedDate)}</span>
                </div>
                <p className={`mt-1 text-[0.7rem] font-medium ${item.isAvailableForRent === false ? "text-red-600" : "text-green-700"}`}>
                    {item.availabilityMessage || (item.isAvailableForRent === false ? "Unavailable for rent" : "Available for rent")}
                </p>

                <div className="mt-3 flex items-center gap-2">
                    <button
                        onClick={() => handleAddToMyBooks(item.readingStatus || "want_to_read")}
                        className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
                    >
                        {readingLabel(item.readingStatus)}
                    </button>
                    <select
                        value={item.readingStatus || "want_to_read"}
                        onChange={(e) =>
                            handleAddToMyBooks(e.target.value as "want_to_read" | "reading" | "completed")
                        }
                        className="rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-700"
                    >
                        <option value="want_to_read">Want to Read</option>
                        <option value="reading">Reading</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
        </article>
    );
}

function SectionHeader({
    title,
    count,
    linkHref = "/books",
    linkText = "View all ->",
}: {
    title: string;
    count: number;
    linkHref?: string;
    linkText?: string;
}) {
    return (
        <div className="mb-7 flex items-center justify-between">
            <div>
                <h2 className="font-serif text-2xl font-bold leading-tight text-stone-900">{title}</h2>
                <p className="mt-0.5 text-xs text-stone-400">{count} books</p>
            </div>
            {linkHref && (
                <Link href={linkHref} className="text-sm font-medium text-amber-700 transition-colors hover:text-amber-900">
                    {linkText}
                </Link>
            )}
        </div>
    );
}

function EmptyState({ message = "No books found." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <p className="font-serif italic text-base">{message}</p>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="aspect-[3/4] bg-stone-200" />
            <div className="space-y-2 p-3.5">
                <div className="h-4 w-3/4 rounded bg-stone-200" />
                <div className="h-3 w-1/2 rounded bg-stone-100" />
                <div className="h-3 w-1/3 rounded bg-stone-100" />
            </div>
        </div>
    );
}

export default function BookGrid({
    books = [],
    loading = false,
    title,
    headerLink,
    headerLinkText,
    emptyMessage,
    limit,
    onToggleFavorite,
    onAddToMyBooks,
}: BookGridProps) {
    const search = useSelector((state: RootState) => state.books.filter.search).trim().toLowerCase();

    const searchedBooks = !search
        ? books
        : books.filter((item) => {
            const title = item.bookName?.toLowerCase() || "";
            const author = item.authorName?.toLowerCase() || "";
            const description = item.description?.toLowerCase() || "";
            const tags = (item.tags || []).join(" ").toLowerCase();
            const genres = (item.genre || []).join(" ").toLowerCase();
            return (
                title.includes(search) ||
                author.includes(search) ||
                description.includes(search) ||
                tags.includes(search) ||
                genres.includes(search)
            );
        });

    const displayBooks = limit ? searchedBooks.slice(0, limit) : searchedBooks;

    return (
        <section className="py-4">
            {title && (
                <SectionHeader title={title} count={displayBooks.length} linkHref={headerLink} linkText={headerLinkText} />
            )}

            {loading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : displayBooks.length === 0 ? (
                <EmptyState message={emptyMessage} />
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {displayBooks.map((item) => (
                        <BookCard
                            key={item.id}
                            item={item}
                            onToggleFavorite={onToggleFavorite}
                            onAddToMyBooks={onAddToMyBooks}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
