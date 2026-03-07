"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxToolkit/store";

type ReadingStatus = "want_to_read" | "reading" | "completed";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (value?: string) => {
    if (!value) return "/file.svg";
    const normalized = value.replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${path}`;
};

interface MyBookItem {
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

const statusLabel: Record<ReadingStatus, string> = {
    want_to_read: "Want to Read",
    reading: "Reading",
    completed: "Completed",
};

export default function MyBookPage() {
    const { token } = useSelector((state: RootState) => state.auth);
    const [items, setItems] = useState<MyBookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<ReadingStatus>("want_to_read");

    const fetchMyBooks = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError("");
            const response = await axios.get("http://localhost:5000/api/users/my-books", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems(response.data?.items || []);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch my books");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBooks();
    }, [token]);

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items
            .filter((item) => item.status === activeTab)
            .filter((item) => {
                if (!q) return true;
                return (
                    item.book.title.toLowerCase().includes(q) ||
                    item.book.authorName.toLowerCase().includes(q)
                );
            });
    }, [items, search, activeTab]);

    const updateStatus = async (bookId: string, status: ReadingStatus) => {
        if (!token) return;
        try {
            await axios.put(
                `http://localhost:5000/api/users/my-books/${bookId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setItems((prev) =>
                prev.map((item) =>
                    item.book._id === bookId ? { ...item, status, updatedAt: new Date().toISOString() } : item
                )
            );
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update status");
        }
    };

    const removeBook = async (bookId: string) => {
        if (!token) return;
        try {
            await axios.delete(`http://localhost:5000/api/users/my-books/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems((prev) => prev.filter((item) => item.book._id !== bookId));
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to remove book");
        }
    };

    return (
        <div className="min-h-screen py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">My Book Tracker</h1>
                <p className="text-sm text-gray-600">
                    Track books you want to read, are reading, and have completed.
                </p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {(["want_to_read", "reading", "completed"] as ReadingStatus[]).map((status) => (
                    <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`rounded px-3 py-1.5 text-sm ${
                            activeTab === status
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        {statusLabel[status]}
                    </button>
                ))}
            </div>

            <div className="mb-4">
                <input
                    type="search"
                    placeholder="Search by title or author..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 sm:w-96"
                />
            </div>

            {error && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="py-10 text-center text-gray-600">Loading your books...</div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 px-6 py-12 text-center text-gray-600">
                    No books in {statusLabel[activeTab]}.
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
                            {filteredItems.map((item) => (
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
            )}
        </div>
    );
}
