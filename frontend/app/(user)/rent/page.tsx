'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { createBookThunk } from '@/app/reduxToolkit/slice';
import axios from 'axios';
import { TrendingUp, BookOpen, DollarSign, Clock, Upload, X } from 'lucide-react';

interface BookForm {
    title: string;
    authorName: string;
    publishedDate: string;
    pages: string;
    genre: string;
    description: string;
    tags: string;
    image: File | null;
}

interface MyBook {
    _id: string;
    title: string;
    authorName: string;
    image: string;
    pages: number;
    publishedDate: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (value?: string) => {
    if (!value) return "/file.svg";
    const normalized = value.replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${path}`;
};

const RentPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { user: profileUser } = useSelector((state: RootState) => state.profile);
    const { user: authUser, token } = useSelector((state: RootState) => state.auth);
    const { loading: booksLoading } = useSelector((state: RootState) => state.books);
    const rentalStatus = profileUser?.rentalStatus || 'inactive';
    const [showAddForm, setShowAddForm] = useState(false);
    const [myBooksLoading, setMyBooksLoading] = useState(false);
    const [myBooks, setMyBooks] = useState<MyBook[]>([]);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [form, setForm] = useState<BookForm>({
        title: '',
        authorName: '',
        publishedDate: '',
        pages: '',
        genre: '',
        description: '',
        tags: '',
        image: null
    });

    // Redirect if not approved
    useEffect(() => {
        if (!authUser) {
            router.push('/auth/login');
        } else if (rentalStatus !== 'approved') {
            router.push('/profile?tab=rental-services');
        }
    }, [authUser, rentalStatus, router]);

    useEffect(() => {
        if (token && rentalStatus === 'approved') {
            fetchMyBooks();
        }
    }, [token, rentalStatus]);

    // Show loading state while checking authorization
    if (!profileUser || rentalStatus !== 'approved') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (file: File | null) => {
        setForm((prev) => ({ ...prev, image: file }));
        setPreviewUrl(file ? URL.createObjectURL(file) : '');
    };

    const resetForm = () => {
        setForm({
            title: '',
            authorName: '',
            publishedDate: '',
            pages: '',
            genre: '',
            description: '',
            tags: '',
            image: null
        });
        setPreviewUrl('');
    };

    const handleSubmitBook = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess('');

        if (!form.title || !form.authorName || !form.publishedDate || !form.pages || !form.image) {
            setSubmitError('Title, author, published date, pages, and cover image are required.');
            return;
        }

        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('authorName', form.authorName);
        formData.append('publishedDate', form.publishedDate);
        formData.append('pages', form.pages);
        formData.append('genre', form.genre);
        formData.append('description', form.description);
        formData.append('tags', form.tags);
        formData.append('image', form.image);

        const result = await dispatch(createBookThunk(formData));
        if (createBookThunk.fulfilled.match(result)) {
            setSubmitSuccess('Book added successfully and is now available for renting.');
            resetForm();
            setShowAddForm(false);
            fetchMyBooks();
            return;
        }

        setSubmitError((result.payload as string) || 'Failed to add book');
    };

    const fetchMyBooks = async () => {
        if (!token) return;

        try {
            setMyBooksLoading(true);
            const response = await axios.get('http://localhost:5000/api/books/mine', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyBooks(response.data.books || []);
        } catch (error) {
            setMyBooks([]);
        } finally {
            setMyBooksLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Rental Dashboard</h1>
                <p className="text-gray-600">Manage your book rentals and track earnings</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Active Rentals */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Active Rentals</p>
                            <p className="text-3xl font-bold text-gray-900">0</p>
                        </div>
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                            <BookOpen className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Pending Returns */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Pending Returns</p>
                            <p className="text-3xl font-bold text-gray-900">0</p>
                        </div>
                        <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Monthly Earnings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Monthly Earnings</p>
                            <p className="text-3xl font-bold text-gray-900">$0.00</p>
                        </div>
                        <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Total Earnings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                            <p className="text-3xl font-bold text-gray-900">$0.00</p>
                        </div>
                        <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* My Books for Rent */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Books for Rent</h2>
                    <button
                        onClick={() => {
                            setSubmitError('');
                            setSubmitSuccess('');
                            setShowAddForm((prev) => !prev);
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-medium"
                    >
                        {showAddForm ? 'Close Form' : 'Add Book'}
                    </button>
                </div>

                {submitError && (
                    <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700">
                        {submitError}
                    </div>
                )}
                {submitSuccess && (
                    <div className="mb-4 p-3 rounded border border-green-300 bg-green-50 text-green-700">
                        {submitSuccess}
                    </div>
                )}

                {showAddForm && (
                    <form onSubmit={handleSubmitBook} className="mb-6 border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                <input
                                    name="authorName"
                                    value={form.authorName}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
                                <input
                                    type="date"
                                    name="publishedDate"
                                    value={form.publishedDate}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                                <input
                                    type="number"
                                    min="1"
                                    name="pages"
                                    value={form.pages}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                                <input
                                    name="genre"
                                    value={form.genre}
                                    onChange={handleInputChange}
                                    placeholder="Fiction"
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                <input
                                    name="tags"
                                    value={form.tags}
                                    onChange={handleInputChange}
                                    placeholder="classic, mystery"
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded cursor-pointer w-fit hover:bg-gray-50">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm">Upload cover</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                                />
                            </label>
                            {previewUrl && (
                                <div className="mt-3 relative w-24 h-32">
                                    <img src={previewUrl} alt="Preview" className="w-24 h-32 object-cover rounded border" />
                                    <button
                                        type="button"
                                        onClick={() => handleImageChange(null)}
                                        className="absolute -top-2 -right-2 bg-white rounded-full border p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setShowAddForm(false);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={booksLoading}
                                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                            >
                                {booksLoading ? 'Adding...' : 'Add Book For Rent'}
                            </button>
                        </div>
                    </form>
                )}

                {myBooksLoading ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-600">
                        Loading your books...
                    </div>
                ) : myBooks.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                            You haven't added any books yet.
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-medium inline-block"
                        >
                            Add Your First Book
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left">Cover</th>
                                    <th className="px-4 py-3 text-left">Title</th>
                                    <th className="px-4 py-3 text-left">Author</th>
                                    <th className="px-4 py-3 text-left">Pages</th>
                                    <th className="px-4 py-3 text-left">Published</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myBooks.map((book) => (
                                    <tr key={book._id} className="border-b">
                                        <td className="px-4 py-3">
                                            <img
                                                src={resolveImageUrl(book.image)}
                                                alt={book.title}
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    img.onerror = null;
                                                    img.src = "/file.svg";
                                                }}
                                                className="w-12 h-16 object-cover rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium">{book.title}</td>
                                        <td className="px-4 py-3">{book.authorName}</td>
                                        <td className="px-4 py-3">{book.pages}</td>
                                        <td className="px-4 py-3">{new Date(book.publishedDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Rentals */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Rentals</h2>

                {/* Empty State */}
                <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                        No recent rentals yet. Once your books are rented, they will appear here.
                    </p>
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
                <ul className="text-gray-700 space-y-2">
                    <li>✓ Add books from your collection that you want to rent out</li>
                    <li>✓ Set your rental terms and pricing for each book</li>
                    <li>✓ Users can browse and rent your books</li>
                    <li>✓ Track all rental transactions and earnings</li>
                    <li>✓ Manage book returns and availability</li>
                </ul>
            </div>
        </div>
    );
};

export default RentPage;
