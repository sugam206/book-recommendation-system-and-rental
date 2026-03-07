'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Rental {
    _id: string;
    userId: { username: string; email: string };
    bookId: { title: string; author?: string; authorName?: string };
    rentStartDate: string;
    rentEndDate: string;
    amount: number;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    createdAt: string;
}

interface BookOption {
    _id: string;
    title: string;
    authorName: string;
}

interface UserOption {
    _id: string;
    username: string;
    email: string;
    role?: string;
    rentalStatus?: string;
}

export default function RentalsPage() {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [books, setBooks] = useState<BookOption[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [creating, setCreating] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [newRentForm, setNewRentForm] = useState({
        userId: '',
        bookId: '',
        rentStartDate: '',
        rentEndDate: '',
        amount: ''
    });

    // Redirect if not admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/profile');
        }
    }, [user, router]);

    // Fetch rentals
    useEffect(() => {
        if (token) {
            fetchRentals();
        }
    }, [token, currentPage, statusFilter]);

    useEffect(() => {
        if (token) {
            fetchFormOptions();
        }
    }, [token]);

    const fetchRentals = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const query = statusFilter !== 'all' ? `?status=${statusFilter}&page=${currentPage}` : `?page=${currentPage}`;
            const response = await axios.get(
                `http://localhost:5000/api/rents${query}`,
                { headers }
            );
            setRentals(response.data.rents || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch rentals');
        } finally {
            setLoading(false);
        }
    };

    const fetchFormOptions = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [booksRes, usersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/books?limit=200', { headers }),
                axios.get('http://localhost:5000/api/users', { headers })
            ]);

            setBooks(booksRes.data.books || []);
            setUsers((usersRes.data.users || []).filter((u: UserOption) => u.role !== 'admin'));
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to load users/books for rent form');
        }
    };

    const handleCreateRent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if (!newRentForm.userId || !newRentForm.bookId || !newRentForm.rentStartDate || !newRentForm.rentEndDate || !newRentForm.amount) {
            setFormError('Please fill all fields');
            return;
        }

        if (new Date(newRentForm.rentEndDate) < new Date(newRentForm.rentStartDate)) {
            setFormError('End date must be after start date');
            return;
        }

        try {
            setCreating(true);
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(
                'http://localhost:5000/api/rents',
                {
                    userId: newRentForm.userId,
                    bookId: newRentForm.bookId,
                    rentStartDate: newRentForm.rentStartDate,
                    rentEndDate: newRentForm.rentEndDate,
                    amount: Number(newRentForm.amount)
                },
                { headers }
            );

            setFormSuccess('Book rent created successfully');
            setNewRentForm({
                userId: '',
                bookId: '',
                rentStartDate: '',
                rentEndDate: '',
                amount: ''
            });
            fetchRentals();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to create rent');
        } finally {
            setCreating(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'active':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-blue-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'completed':
                return 'bg-blue-100 text-blue-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading && rentals.length === 0) {
        return <div className="text-center py-12">Loading rentals...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Book for Rent</h2>

                {(formError || formSuccess) && (
                    <div className={`mb-4 p-3 border rounded ${formError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
                        {formError || formSuccess}
                    </div>
                )}

                <form onSubmit={handleCreateRent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                        <select
                            value={newRentForm.userId}
                            onChange={(e) => setNewRentForm((prev) => ({ ...prev, userId: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        >
                            <option value="">Select user</option>
                            {users.map((u) => (
                                <option key={u._id} value={u._id}>
                                    {u.username} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
                        <select
                            value={newRentForm.bookId}
                            onChange={(e) => setNewRentForm((prev) => ({ ...prev, bookId: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        >
                            <option value="">Select book</option>
                            {books.map((b) => (
                                <option key={b._id} value={b._id}>
                                    {b.title} - {b.authorName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={newRentForm.rentStartDate}
                            onChange={(e) => setNewRentForm((prev) => ({ ...prev, rentStartDate: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={newRentForm.rentEndDate}
                            onChange={(e) => setNewRentForm((prev) => ({ ...prev, rentEndDate: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="1"
                                value={newRentForm.amount}
                                onChange={(e) => setNewRentForm((prev) => ({ ...prev, amount: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="Amount"
                                required
                            />
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap"
                            >
                                {creating ? 'Adding...' : 'Add Rent'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Rentals</h1>
                    <div className="flex gap-2">
                        {(['all', 'pending', 'active', 'completed', 'cancelled'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setStatusFilter(status);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded capitalize ${statusFilter === status
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Book</th>
                                <th className="px-4 py-3 text-left">Rent Period</th>
                                <th className="px-4 py-3 text-left">Amount</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rentals.map((rental) => (
                                <tr key={rental._id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{rental.userId.username}</div>
                                        <div className="text-sm text-gray-500">{rental.userId.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{rental.bookId.title}</div>
                                        <div className="text-sm text-gray-500">{rental.bookId.authorName || rental.bookId.author || '-'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div>{new Date(rental.rentStartDate).toLocaleDateString()}</div>
                                        <div className="text-gray-500">to</div>
                                        <div>{new Date(rental.rentEndDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">Rs. {rental.amount}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${getStatusColor(rental.status)}`}>
                                            {getStatusIcon(rental.status)}
                                            {rental.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => router.push(`/admin/rentals/${rental._id}`)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {rentals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No rentals found</div>
                )}

                {/* Pagination */}
                <div className="mt-6 flex justify-center gap-2">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
