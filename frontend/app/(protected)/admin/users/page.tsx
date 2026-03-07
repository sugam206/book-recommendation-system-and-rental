'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Trash2, Eye, Shield, ShieldOff } from 'lucide-react';

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
    isRenter: boolean;
    rentalStatus: string;
    createdAt: string;
    profilePicture?: string;
}

export default function UsersPage() {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Redirect if not admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/profile');
        }
    }, [user, router]);

    // Fetch users
    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token, currentPage, searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(
                `http://localhost:5000/api/users?page=${currentPage}&search=${searchTerm}`,
                { headers }
            );
            setUsers(response.data.users || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`http://localhost:5000/api/users/${userId}`, { headers });
            setUsers(users.filter(u => u._id !== userId));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.put(`http://localhost:5000/api/users/${userId}`,
                { role: isAdmin ? 'user' : 'admin' },
                { headers }
            );
            setUsers(users.map(u =>
                u._id === userId ? { ...u, role: isAdmin ? 'user' : 'admin' } : u
            ));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update user');
        }
    };

    if (loading && users.length === 0) {
        return <div className="text-center py-12">Loading users...</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                />
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
                            <th className="px-4 py-3 text-left">Username</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Role</th>
                            <th className="px-4 py-3 text-left">Renter Status</th>
                            <th className="px-4 py-3 text-left">Joined</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{u.username}</td>
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-3 py-1 rounded-full text-sm ${u.role === 'admin'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-3 py-1 rounded text-sm ${u.rentalStatus === 'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : u.rentalStatus === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {u.rentalStatus}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 flex gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/users/${u._id}`)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleAdmin(u._id, u.role === 'admin')}
                                        className={`p-2 rounded ${u.role === 'admin'
                                                ? 'text-red-600 hover:bg-red-50'
                                                : 'text-green-600 hover:bg-green-50'
                                            }`}
                                    >
                                        {u.role === 'admin' ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">No users found</div>
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
    );
}
