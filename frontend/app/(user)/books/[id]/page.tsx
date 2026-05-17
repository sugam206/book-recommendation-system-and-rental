'use client';

import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/app/reduxToolkit/store";
import { useEffect, useMemo, useState } from "react";
import { fetchBooks, upsertMyBookStatus, rateBook } from "@/app/reduxToolkit/slice";
import axios from "axios";
import { toast } from "react-toastify";
import Script from "next/script";

type ReadingStatus = "want_to_read" | "reading" | "completed";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
            on: (event: string, callback: (response: Record<string, unknown>) => void) => void;
        };
    }
}

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
    const [rentDays, setRentDays] = useState(30);
    const [isAvailableForRent, setIsAvailableForRent] = useState(true);
    const [availabilityMessage, setAvailabilityMessage] = useState("Available for rent");
    const [checkoutReady, setCheckoutReady] = useState(false);

    // NEW: Local states for fetching single book
    const [fetchedBook, setFetchedBook] = useState<any>(null);
    const [bookLoading, setBookLoading] = useState(false);
    const [bookError, setBookError] = useState("");

    useEffect(() => {
        if (books.length === 0) {
            dispatch(fetchBooks());
        }
    }, [dispatch, books.length]);

    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    let book = books.find((b) => b.id === id);

    // NEW: Fetch single book if not found in Redux state
    useEffect(() => {
        if (id && !book && token && !bookLoading) {
            const fetchSingleBook = async () => {
                setBookLoading(true);
                setBookError("");
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/books/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data?.book) {
                        const rawBook = response.data.book;
                        const mappedBook = {
                            id: rawBook._id ?? rawBook.id,
                            rentalProviderId: rawBook.rentalProviderId,
                            bookName: rawBook.title ?? rawBook.bookName,
                            authorName: rawBook.authorName,
                            price: Number(rawBook.price ?? 0),
                            image: rawBook.image?.startsWith('http')
                                ? rawBook.image
                                : `${API_BASE_URL}${rawBook.image?.startsWith('/') ? rawBook.image : '/' + rawBook.image}`,
                            publishedDate: rawBook.publishedDate,
                            pages: rawBook.pages,
                            genre: Array.isArray(rawBook.genre) ? rawBook.genre : (rawBook.genre ? [rawBook.genre] : []),
                            isFavourite: rawBook.isFavourite ?? false,
                            averageRating: rawBook.averageRating,
                            ratingsCount: rawBook.ratingsCount,
                            description: rawBook.description,
                            tags: rawBook.tags ?? [],
                            lastUpdatedDate: rawBook.lastUpdatedDate,
                            readingStatus: rawBook.readingStatus ?? null,
                            myRating: rawBook.myRating ?? null,
                            isAvailableForRent: rawBook.isAvailableForRent ?? true,
                            availabilityStatus: rawBook.availabilityStatus ?? 'available',
                            availabilityMessage: rawBook.availabilityMessage ?? 'Available for rent',
                        };
                        setFetchedBook(mappedBook);
                    }
                } catch (err: unknown) {
                    const message = axios.isAxiosError(err)
                        ? err.response?.data?.message
                        : "Failed to load book";
                    setBookError(message || "Book not found");
                } finally {
                    setBookLoading(false);
                }
            };
            fetchSingleBook();
        }
    }, [id, book, token, bookLoading]);

    // Use fetchedBook if Redux book not found
    if (!book && fetchedBook) {
        book = fetchedBook;
    }

    useEffect(() => {
        if (!book) return;
        setIsAvailableForRent(book.isAvailableForRent ?? true);
        setAvailabilityMessage(book.availabilityMessage || ((book.isAvailableForRent ?? true) ? "Available for rent" : "Currently not available for rent"));
    }, [book?.id, book?.isAvailableForRent, book?.availabilityMessage]);

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
            } catch (err: unknown) {
                const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
                setCanRent(false);
                setCanRentMessage(message || "Unable to verify rental eligibility");
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
            toast.success(`Book added to ${labelMap[status]}`);
        } else {
            setStatusMessage((result.payload as string) || "Failed to update my books");
            toast.error((result.payload as string) || "Failed to update my books");
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
            toast.success(`You rated this book ${rating}/5`);
        } else {
            setRateMessage((result.payload as string) || "Failed to submit rating");
            toast.error((result.payload as string) || "Failed to submit rating");
        }
        setRateLoading(false);
    };

    const handleRentRequest = async () => {
        if (!book || !token) return;
        if (!window.Razorpay || !checkoutReady) {
            const message = "Razorpay checkout is still loading. Please try again in a moment.";
            setRentMessage(message);
            toast.error(message);
            return;
        }
        let openedCheckout = false;
        setRentLoading(true);
        setRentMessage("");
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/rents/checkout-order`,
                { bookId: book.id, days: rentDays },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const razorpay = new window.Razorpay({
                key: response.data?.key,
                amount: response.data?.order?.amount,
                currency: response.data?.order?.currency || "INR",
                name: "Book Rental Deposit",
                description: `Deposit for ${book.bookName}`,
                order_id: response.data?.order?.id,
                prefill: {
                    name: response.data?.renter?.name || authUser?.username || "",
                    email: response.data?.renter?.email || authUser?.email || ""
                },
                notes: {
                    bookTitle: response.data?.book?.title || book.bookName,
                    requestedDays: String(rentDays)
                },
                theme: {
                    color: "#166534"
                },
                handler: async (paymentResponse: Record<string, unknown>) => {
                    try {
                        const verifyResponse = await axios.post(
                            `${API_BASE_URL}/api/rents/verify-payment`,
                            {
                                rentId: response.data?.rentId,
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_signature: paymentResponse.razorpay_signature
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        const successMessage = verifyResponse.data?.message || "Deposit paid successfully";
                        setRentMessage(successMessage);
                        toast.success(successMessage);
                        setIsAvailableForRent(false);
                        setAvailabilityMessage("Deposit received. Pending provider review");
                    } catch (verifyError: unknown) {
                        const message = axios.isAxiosError(verifyError)
                            ? verifyError.response?.data?.message
                            : undefined;
                        setRentMessage(message || "Payment was completed but verification failed");
                        toast.error(message || "Payment was completed but verification failed");
                    } finally {
                        setRentLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setRentLoading(false);
                    }
                }
            });

            razorpay.on("payment.failed", (paymentError: Record<string, unknown>) => {
                const error = paymentError.error as { description?: string } | undefined;
                const message = error?.description || "Payment failed or was cancelled";
                setRentMessage(message);
                toast.error(message);
                setRentLoading(false);
            });

            razorpay.open();
            openedCheckout = true;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            setRentMessage(message || "Failed to start Razorpay checkout");
            toast.error(message || "Failed to start Razorpay checkout");
        } finally {
            if (!openedCheckout) {
                setRentLoading(false);
            }
        }
    };

    // Show loading state while fetching
    if (bookLoading && !book) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-stone-700">Loading book...</p>
            </div>
        );
    }

    // Show error if book not found
    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-stone-700">{bookError || "This book is not available"}</p>
            </div>
        );
    }

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
                onLoad={() => setCheckoutReady(true)}
                onError={() => setCheckoutReady(false)}
            />
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
                                    <p className="text-sm uppercase tracking-wide text-stone-600">Deposit Required</p>
                                    <p className="text-lg font-semibold text-stone-800">Rs. {book.price}</p>
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
                                            className={`rounded px-3 py-2 text-sm font-medium transition-colors ${(book.myRating || 0) >= value
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
                                        {availabilityMessage}
                                    </p>

                                    {book.rentalProviderId && authUser?.id && String(book.rentalProviderId) === String(authUser.id) ? (
                                        <p className="text-sm text-stone-600">This is your listed book.</p>
                                    ) : !canRent ? (
                                        <p className="text-sm text-stone-600">
                                            {canRentMessage || "Your rental service request must be approved before renting."}
                                        </p>
                                    ) : isAvailableForRent ? (
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                            <div className="mb-3 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-emerald-900">Secure Deposit</p>
                                                    <p className="text-2xl font-bold text-emerald-950">Rs. {book.price}</p>
                                                </div>
                                                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow-sm">
                                                    Razorpay Test UI
                                                </div>
                                            </div>
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
                                                    disabled={rentLoading || !checkoutReady}
                                                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    {rentLoading ? "Opening payment..." : "Pay Deposit with Razorpay"}
                                                </button>
                                            </div>
                                            <p className="mt-3 text-xs text-stone-500">
                                                This opens the Razorpay checkout modal and keeps the deposit on hold until the provider decision and admin confirmation flow is completed.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-stone-600">
                                            {availabilityMessage}
                                        </p>
                                    )}

                                    {isAvailableForRent && canRent && (
                                        <p className="text-xs text-stone-500">
                                            Renting this book will hold a Razorpay deposit of Rs. {book.price} until the provider decision and admin confirmation flow is completed.
                                        </p>
                                    )}

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
                                    className="group"
                                >
                                    <img
                                        src={related.image}
                                        alt={related.bookName}
                                        className="mb-2 h-32 w-full rounded-lg object-cover shadow transition-transform group-hover:scale-105"
                                    />
                                    <p className="line-clamp-2 text-sm font-medium text-stone-900">{related.bookName}</p>
                                    <p className="text-xs text-stone-600">{related.authorName}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default BookDetails;