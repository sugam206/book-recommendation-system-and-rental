'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/reduxToolkit/store';
import { fetchBooks, createBookThunk, deleteBookThunk } from '@/app/reduxToolkit/slice';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Trash2, Edit2, Eye, X, Upload, BookPlus, ImagePlus } from 'lucide-react';

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Self-Help', 'Other'];

interface BookForm {
    title: string;
    authorName: string;
    price: string;
    rentalProviderId: string;
    publishedDate: string;
    pages: string;
    genre: string;
    description: string;
    tags: string;
    image: File | null;
}

const EMPTY_FORM: BookForm = {
    title: '', authorName: '', price: '', rentalProviderId: '', publishedDate: '',
    pages: '', genre: '', description: '', tags: '', image: null,
};

interface RentalProviderOption {
    _id: string;
    username: string;
    email: string;
    rentalStatus?: string;
}

// ─── Add Book Modal ───────────────────────────────────────────────────────────
function AddBookModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: FormData) => Promise<void> }) {
    const [form, setForm] = useState<BookForm>(EMPTY_FORM);
    const [preview, setPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [providers, setProviders] = useState<RentalProviderOption[]>([]);

    useEffect(() => {
        const loadProviders = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/users', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                setProviders((response.data?.users || []).filter((user: RentalProviderOption) => user.rentalStatus === 'approved'));
            } catch {
                setProviders([]);
            }
        };
        loadProviders();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleImage = (file: File) => {
        setForm(prev => ({ ...prev, image: file }));
        setPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith('image/')) handleImage(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.title || !form.authorName || !form.price || !form.rentalProviderId || !form.publishedDate || !form.pages) {
            return setError('Title, author, price, rental provider, published date and pages are required.');
        }
        if (!form.image) return setError('Cover image is required.');

        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('authorName', form.authorName);
        formData.append('price', form.price);
        formData.append('rentalProviderId', form.rentalProviderId);
        formData.append('publishedDate', form.publishedDate);
        formData.append('pages', form.pages);
        formData.append('genre', form.genre);
        formData.append('description', form.description);
        formData.append('tags', form.tags);
        formData.append('image', form.image);   // multer field: "image"

        try {
            setSubmitting(true);
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add book');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <BookPlus className="w-5 h-5 text-amber-700" />
                        <h2 className="text-lg font-bold text-stone-900">Add New Book</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
                    )}

                    {/* Image upload */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                            Cover Image <span className="text-red-400">*</span>
                        </label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            className="border-2 border-dashed border-stone-200 rounded-xl overflow-hidden hover:border-amber-400 transition-colors"
                        >
                            {preview ? (
                                <div className="relative h-48 group">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer flex items-center gap-2 text-white text-sm font-medium bg-white/20 px-4 py-2 rounded-full border border-white/50">
                                            <ImagePlus className="w-4 h-4" /> Change Image
                                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center gap-2 py-10 cursor-pointer">
                                    <Upload className="w-8 h-8 text-stone-300" />
                                    <p className="text-sm font-medium text-stone-500">Drop image here or <span className="text-amber-700 underline">browse</span></p>
                                    <p className="text-xs text-stone-400">JPEG, PNG, WEBP · max 5MB</p>
                                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Title & Author */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { name: 'title', label: 'Title', placeholder: 'Book title', required: true },
                            { name: 'authorName', label: 'Author', placeholder: 'Author name', required: true },
                        ].map(f => (
                            <div key={f.name}>
                                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                                    {f.label} {f.required && <span className="text-red-400">*</span>}
                                </label>
                                <input
                                    name={f.name}
                                    value={(form as any)[f.name]}
                                    onChange={handleChange}
                                    placeholder={f.placeholder}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Price, Provider, Date & Pages */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                                Price / Deposit <span className="text-red-400">*</span>
                            </label>
                            <input type="number" name="price" value={form.price} onChange={handleChange}
                                placeholder="e.g. 850" min={0}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                                Rental Provider <span className="text-red-400">*</span>
                            </label>
                            <select
                                name="rentalProviderId"
                                value={form.rentalProviderId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            >
                                <option value="">Select provider</option>
                                {providers.map((provider) => (
                                    <option key={provider._id} value={provider._id}>
                                        {provider.username} ({provider.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                                Published Date <span className="text-red-400">*</span>
                            </label>
                            <input type="date" name="publishedDate" value={form.publishedDate} onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                                Pages <span className="text-red-400">*</span>
                            </label>
                            <input type="number" name="pages" value={form.pages} onChange={handleChange}
                                placeholder="e.g. 320" min={1}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                        </div>
                    </div>

                    {/* Genre */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Genre</label>
                        <select name="genre" value={form.genre} onChange={handleChange}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                            <option value="">Select genre</option>
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                            Tags <span className="text-stone-400 font-normal">(comma separated)</span>
                        </label>
                        <input name="tags" value={form.tags} onChange={handleChange}
                            placeholder="e.g. adventure, classic, must-read"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange}
                            placeholder="Brief description..." rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                            {submitting ? (
                                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>Uploading...</>
                            ) : (
                                <><BookPlus className="w-4 h-4" />Add Book</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BooksPage() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { books, loading, error, pagination } = useSelector((state: RootState) => state.books);
    const { user } = useSelector((state: RootState) => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (user && user.role !== 'admin') router.push('/profile');
    }, [user, router]);

    const limit = 10;

    useEffect(() => {
        dispatch(fetchBooks({ page: currentPage, limit, search: searchTerm || undefined }));
    }, [dispatch, currentPage, searchTerm]);

    const totalPages = Math.max(1, pagination.totalPages ?? 1);
    const displayBooks = books;

    const handleAddBook = async (formData: FormData) => {
        const result = await dispatch(createBookThunk(formData));
        if (createBookThunk.rejected.match(result)) {
            throw new Error(result.payload as string);
        }
    };

    const handleDelete = async (bookId: string) => {
        if (!confirm('Are you sure you want to delete this book?')) return;
        setDeleteError('');
        const result = await dispatch(deleteBookThunk(bookId));
        if (deleteBookThunk.rejected.match(result)) {
            setDeleteError(result.payload as string);
        }
    };

    if (loading && books.length === 0) {
        return (
            <div className="flex items-center justify-center py-24 text-stone-400">
                <svg className="animate-spin w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Loading books...
            </div>
        );
    }

    return (
        <>
            {showModal && (
                <AddBookModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleAddBook}
                />
            )}

            <div className="p-6 bg-white rounded-2xl shadow-sm">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">Manage Books</h1>
                        <p className="text-sm text-stone-400 mt-0.5">{pagination.total} books total</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search books..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                            <BookPlus className="w-4 h-4" /> Add Book
                        </button>
                    </div>
                </div>

                {(error || deleteError) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                        {error || deleteError}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Cover</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Author</th>
                                <th className="px-4 py-3">Genre</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Pages</th>
                                <th className="px-4 py-3">Published</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayBooks.map((book) => (
                                <tr key={book.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-4 py-3">
                                        {book.image ? (
                                            <img src={book.image} alt={book.bookName}
                                                className="w-10 h-14 object-cover rounded-md shadow-sm" />
                                        ) : (
                                            <div className="w-10 h-14 bg-stone-100 rounded-md flex items-center justify-center">
                                                <BookPlus className="w-4 h-4 text-stone-300" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-stone-900 max-w-40 truncate">{book.bookName}</td>
                                    <td className="px-4 py-3 text-stone-600">{book.authorName}</td>
                                    <td className="px-4 py-3">
                                        {book.genre?.[0] ? (
                                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                                {book.genre[0]}
                                            </span>
                                        ) : <span className="text-stone-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-stone-700 font-medium">Rs. {book.price}</td>
                                    <td className="px-4 py-3 text-stone-500">{book.pages}</td>
                                    <td className="px-4 py-3 text-stone-400 text-xs">
                                        {new Date(book.publishedDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => router.push(`/admin/books/${book.id}`)}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => router.push(`/admin/books/${book.id}/edit`)}
                                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(book.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {displayBooks.length === 0 && !loading && (
                    <div className="text-center py-16 text-stone-400">
                        <BookPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-serif italic">No books found. Add your first book!</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                            className="px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg disabled:opacity-40 transition-colors">
                            ← Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-stone-500">Page {currentPage} of {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                            className="px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg disabled:opacity-40 transition-colors">
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
