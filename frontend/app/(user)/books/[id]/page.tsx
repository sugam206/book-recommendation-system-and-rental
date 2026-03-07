'use client';

import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/app/reduxToolkit/store";
import { useEffect, useMemo, useState } from "react";
import { fetchBooks, upsertMyBookStatus, rateBook } from "@/app/reduxToolkit/slice";
import axios from "axios";

type ReadingStatus = "want_to_read" | "reading" | "completed";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const labelMap: Record<ReadingStatus, string> = {
    want_to_read: "Want to Read",
    reading: "Reading",
    completed: "Completed",
};

const RatingSummary = ({ rating, count }: { rating?: number; count?: number }) => {
    if (!rating) return null;

    const stars = Math.round(rating);

    return (
        <div className="mt-1 flex items-center gap-1.5">
            <div className="flex gap-0.5" aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < stars ? "text-amber-400" : "text-gray-200"}`}>
                        *
                    </span>
                ))}
            </div>
            <span className="text-[11px] text-gray-400">{rating.toFixed(1)}</span>
            {count !== undefined && <span className="text-[11px] text-gray-400">({count})</span>}
        </div>
    );
};

const BookDetails = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { token, user: authUser } = useSelector((state: RootState) => state.auth);
    const { books } = useSelector((state: RootState) => state.books);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [rateLoading, setRateLoading] = useState(false);
    const [rateMessage, setRateMessage] = useState("");
    const [canRent, setCanRent] = useState<boolean>(false);
    const [canRentMessage, setCanRentMessage] = useState("");
    const [rentLoading, setRentLoading] = useState(false);
    const [rentMessage, setRentMessage] = useState("");
    const [rentDays, setRentDays] = useState(7);
    const [isAvailableForRent, setIsAvailableForRent] = useState(true);

    useEffect(() => {
        if (books.length === 0) {
            dispatch(fetchBooks());
        }
    }, [dispatch, books.length]);

    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const book = books.find((b) => b.id === id);

    useEffect(() => {
        if (!book) return;
        setIsAvailableForRent(book.isAvailableForRent ?? true);
    }, [book?.id, book?.isAvailableForRent]);

    useEffect(() => {
        const checkCanRent = async () => {
            if (!token) {
                setCanRent(false);
                setCanRentMessage("Login required to rent books");
                return;
            }
            try {
                const response = await axios.get(`${API_BASE_URL}/api/users/can-rent`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCanRent(!!response.data?.canRent);
                setCanRentMessage(response.data?.reason || "");
            } catch (err: any) {
                setCanRent(false);
                setCanRentMessage(err.response?.data?.message || "Unable to verify rental eligibility");
            }
        };
        checkCanRent();
    }, [token]);

    const relatedByAuthor = useMemo(() => {
        if (!book) return [];
        return books.filter((b) => b.authorName === book.authorName && b.id !== book.id).slice(0, 6);
    }, [books, book]);

    const handleStatusUpdate = async (status: ReadingStatus) => {
        if (!book) return;
        setStatusLoading(true);
        setStatusMessage("");
        const result = await dispatch(upsertMyBookStatus({ bookId: book.id, status }));
        if (upsertMyBookStatus.fulfilled.match(result)) {
            setStatusMessage(`Book added to ${labelMap[status]}`);
        } else {
            setStatusMessage((result.payload as string) || "Failed to update my books");
        }
        setStatusLoading(false);
    };

    const handleRateBook = async (rating: number) => {
        if (!book) return;
        setRateLoading(true);
        setRateMessage("");
        const result = await dispatch(rateBook({ bookId: book.id, rating }));
        if (rateBook.fulfilled.match(result)) {
            setRateMessage(`You rated this book ${rating}/5`);
        } else {
            setRateMessage((result.payload as string) || "Failed to submit rating");
        }
        setRateLoading(false);
    };

    const handleRentRequest = async () => {
        if (!book || !token) return;
        setRentLoading(true);
        setRentMessage("");
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/rents/request`,
                { bookId: book.id, days: rentDays },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRentMessage(response.data?.message || "Rent request submitted");
            setIsAvailableForRent(false);
        } catch (err: any) {
            setRentMessage(err.response?.data?.message || "Failed to submit rent request");
        } finally {
            setRentLoading(false);
        }
    };

    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-stone-700">This book is not available</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-10">
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => router.back()}
                    className="rounded-lg bg-stone-100 px-4 py-2 transition-colors duration-200 hover:bg-amber-300 hover:text-amber-50"
                >
                    Back
                </button>
            </div>

            <div className="mx-auto mb-10 max-w-7xl rounded-xl bg-stone-100 bg-opacity-50 p-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 overflow-hidden rounded-xl border-4 border-stone-600 bg-stone-100 shadow-lg">
                            <img
                                src={book.image}
                                alt={`${book.bookName} cover`}
                                className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold text-stone-900 lg:text-5xl">{book.bookName}</h1>
                            <p className="text-2xl font-medium">by {book.authorName}</p>
                            <RatingSummary rating={book.averageRating} count={book.ratingsCount} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-y-2 border-stone-400 py-4">
                            <div>
                                <p className="text-sm uppercase tracking-wide text-stone-600">Published</p>
                                <p className="text-lg font-semibold text-stone-800">
                                    {new Date(book.publishedDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-wide text-stone-600">Pages</p>
                                <p className="text-lg font-semibold text-stone-800">{book.pages}</p>
                            </div>
                        </div>

                        <p className="text-sm text-stone-600">
                            Last Updated: {new Date(book.lastUpdatedDate).toLocaleDateString()}
                        </p>

                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-lg font-semibold text-stone-900">My Book Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {(["want_to_read", "reading", "completed"] as ReadingStatus[]).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(status)}
                                        disabled={statusLoading}
                                        className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {labelMap[status]}
                                    </button>
                                ))}
                            </div>
                            {statusMessage && (
                                <p className="mt-3 text-sm text-stone-700">{statusMessage}</p>
                            )}
                        </div>

                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-lg font-semibold text-stone-900">Rate This Book</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {([1, 2, 3, 4, 5] as number[]).map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => handleRateBook(value)}
                                        disabled={rateLoading}
                                        className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                                            (book.myRating || 0) >= value
                                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                                        } disabled:opacity-50`}
                                    >
                                        {value}*
                                    </button>
                                ))}
                            </div>
                            {typeof book.myRating === "number" && (
                                <p className="mt-3 text-sm text-stone-700">Your rating: {book.myRating}/5</p>
                            )}
                            {rateMessage && <p className="mt-2 text-sm text-stone-700">{rateMessage}</p>}
                        </div>

                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-lg font-semibold text-stone-900">Book Rental</h3>
                            <div className="space-y-3">
                                <p className={`text-sm ${isAvailableForRent ? "text-green-700" : "text-red-700"}`}>
                                    {isAvailableForRent ? "Available for rent" : "Currently not available for rent"}
                                </p>

                                {book.ownerId && authUser?.id && String(book.ownerId) === String(authUser.id) ? (
                                    <p className="text-sm text-stone-600">This is your listed book.</p>
                                ) : !canRent ? (
                                    <p className="text-sm text-stone-600">
                                        {canRentMessage || "Your rental service request must be approved before renting."}
                                    </p>
                                ) : isAvailableForRent ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <label className="text-sm text-stone-700">Days:</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={60}
                                            value={rentDays}
                                            onChange={(e) => setRentDays(Number(e.target.value) || 1)}
                                            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                                        />
                                        <button
                                            onClick={handleRentRequest}
                                            disabled={rentLoading}
                                            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {rentLoading ? "Submitting..." : "Rent This Book"}
                                        </button>
                                    </div>
                                ) : null}

                                {rentMessage && <p className="text-sm text-stone-700">{rentMessage}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl">
                <h2 className="mb-4 text-2xl font-bold text-stone-900">
                    More by {book.authorName}
                </h2>

                {relatedByAuthor.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-600">
                        No related books found.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {relatedByAuthor.map((related) => (
                            <button
                                key={related.id}
                                onClick={() => router.push(`/books/${related.id}`)}
                                className="overflow-hidden rounded-lg bg-white text-left shadow hover:shadow-md"
                            >
                                <img src={related.image} alt={related.bookName} className="h-36 w-full object-cover" />
                                <div className="p-2">
                                    <p className="line-clamp-2 text-sm font-medium text-stone-800">{related.bookName}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default BookDetails;
