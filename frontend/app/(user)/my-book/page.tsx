"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxToolkit/store";

type ReadingStatus = "want_to_read" | "reading" | "completed";
type LibraryTab = "reading_tracker" | "rented_books";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (value?: string) => {
    if (!value) return "/file.svg";
    const normalized = value.replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${path}`;
};

interface ReadingBookItem {
    book: {
        _id: string;
        title: string;
        authorName: string;
        image: string;
        publishedDate: string;
        pages: number;
    };
    status: ReadingStatus;
    addedAt: string;
    updatedAt: string;
}

interface RentedBookItem {
    _id: string;
    book: {
        _id: string;
        title: string;
        authorName: string;
        image: string;
        publishedDate: string;
        pages: number;
    };
    provider?: {
        username: string;
        email: string;
    };
    requestedDays: number;
    rentStartDate: string;
    rentEndDate: string;
    depositAmount: number;
    paymentStatus: "pending" | "held" | "released" | "refund_pending" | "refunded";
    providerDecision: "pending" | "accepted" | "rejected";
    adminDecision: "pending" | "confirmed_start" | "confirmed_completion" | "refund_processed";
    status: "payment_pending" | "deposit_held" | "provider_accepted" | "refund_pending" | "active" | "completed" | "refunded" | "cancelled";
    createdAt: string;
    updatedAt: string;
}

const statusLabel: Record<ReadingStatus, string> = {
    want_to_read: "Want to Read",
    reading: "Reading",
    completed: "Completed",
};

const libraryTabLabel: Record<LibraryTab, string> = {
    reading_tracker: "Reading Tracker",
    rented_books: "Rented Books",
};

export default function MyBookPage() {
    const { token } = useSelector((state: RootState) => state.auth);
    const [readingItems, setReadingItems] = useState<ReadingBookItem[]>([]);
    const [rentedItems, setRentedItems] = useState<RentedBookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>("reading_tracker");
    const [activeReadingTab, setActiveReadingTab] = useState<ReadingStatus>("want_to_read");

    const fetchLibrary = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const [readingResponse, rentedResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/users/my-books`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_BASE_URL}/api/users/my-books/rented`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            setReadingItems(readingResponse.data?.items || []);
            setRentedItems(rentedResponse.data?.items || []);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(message || "Failed to fetch your library");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLibrary();
    }, [token]);

    const filteredReadingItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        return readingItems
            .filter((item) => item.status === activeReadingTab)
            .filter((item) => {
                if (!q) return true;
                return (
                    item.book.title.toLowerCase().includes(q) ||
                    item.book.authorName.toLowerCase().includes(q)
                );
            });
    }, [readingItems, search, activeReadingTab]);

    const filteredRentedItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rentedItems.filter((item) => {
            if (!q) return true;
            return (
                item.book.title.toLowerCase().includes(q) ||
                item.book.authorName.toLowerCase().includes(q) ||
                item.provider?.username?.toLowerCase().includes(q)
            );
        });
    }, [rentedItems, search]);

    const updateStatus = async (bookId: string, status: ReadingStatus) => {
        if (!token) return;
        try {
            await axios.put(
                `${API_BASE_URL}/api/users/my-books/${bookId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReadingItems((prev) =>
                prev.map((item) =>
                    item.book._id === bookId ? { ...item, status, updatedAt: new Date().toISOString() } : item
                )
            );
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(message || "Failed to update status");
        }
    };

    const removeBook = async (bookId: string) => {
        if (!token) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/users/my-books/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReadingItems((prev) => prev.filter((item) => item.book._id !== bookId));
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(message || "Failed to remove book");
        }
    };

    return (
        <div className="min-h-screen py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">My Library</h1>
                <p className="text-sm text-gray-600">
                    See the books you rented and the books you marked as want to read, reading, or completed.
                </p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {(["reading_tracker", "rented_books"] as LibraryTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveLibraryTab(tab)}
                        className={`rounded px-3 py-1.5 text-sm ${
                            activeLibraryTab === tab
                                ? "bg-stone-800 text-white"
                                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                        }`}
                    >
                        {libraryTabLabel[tab]}
                    </button>
                ))}
            </div>

            {activeLibraryTab === "reading_tracker" && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {(["want_to_read", "reading", "completed"] as ReadingStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveReadingTab(status)}
                            className={`rounded px-3 py-1.5 text-sm ${
                                activeReadingTab === status
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            {statusLabel[status]}
                        </button>
                    ))}
                </div>
            )}

            <div className="mb-4">
                <input
                    type="search"
                    placeholder={
                        activeLibraryTab === "reading_tracker"
                            ? "Search your tracked books by title or author..."
                            : "Search rented books by title, author, or provider..."
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 sm:w-[28rem]"
                />
            </div>

            {error && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="py-10 text-center text-gray-600">Loading your library...</div>
            ) : activeLibraryTab === "reading_tracker" ? (
                filteredReadingItems.length === 0 ? (
                    <div className="rounded border border-dashed border-gray-300 px-6 py-12 text-center text-gray-600">
                        No books in {statusLabel[activeReadingTab]}.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left">Book</th>
                                    <th className="px-4 py-3 text-left">Author</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Updated</th>
                                    <th className="px-4 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReadingItems.map((item) => (
                                    <tr key={item.book._id} className="border-b">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={resolveImageUrl(item.book.image)}
                                                    alt={item.book.title}
                                                    onError={(e) => {
                                                        const img = e.currentTarget;
                                                        img.onerror = null;
                                                        img.src = "/file.svg";
                                                    }}
                                                    className="h-14 w-10 rounded object-cover"
                                                />
                                                <div className="font-medium">{item.book.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{item.book.authorName}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.status}
                                                onChange={(e) =>
                                                    updateStatus(item.book._id, e.target.value as ReadingStatus)
                                                }
                                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                                            >
                                                <option value="want_to_read">Want to Read</option>
                                                <option value="reading">Reading</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(item.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => removeBook(item.book._id)}
                                                className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : filteredRentedItems.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 px-6 py-12 text-center text-gray-600">
                    You have not rented any books yet.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg bg-white shadow">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left">Book</th>
                                <th className="px-4 py-3 text-left">Provider</th>
                                <th className="px-4 py-3 text-left">Deposit</th>
                                <th className="px-4 py-3 text-left">Rental Period</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRentedItems.map((item) => (
                                <tr key={item._id} className="border-b">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={resolveImageUrl(item.book.image)}
                                                alt={item.book.title}
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    img.onerror = null;
                                                    img.src = "/file.svg";
                                                }}
                                                className="h-14 w-10 rounded object-cover"
                                            />
                                            <div>
                                                <div className="font-medium">{item.book.title}</div>
                                                <div className="text-sm text-gray-500">{item.book.authorName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{item.provider?.username || "Unknown provider"}</div>
                                        <div className="text-sm text-gray-500">{item.provider?.email || "-"}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">Rs. {item.depositAmount}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div>{new Date(item.rentStartDate).toLocaleDateString()}</div>
                                        <div>to {new Date(item.rentEndDate).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-400">{item.requestedDays} day(s)</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium capitalize">{item.status.replace(/_/g, " ")}</div>
                                        <div className="text-xs text-gray-500">Provider: {item.providerDecision}</div>
                                        <div className="text-xs text-gray-500">Admin: {item.adminDecision}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                                        {item.paymentStatus.replace(/_/g, " ")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
