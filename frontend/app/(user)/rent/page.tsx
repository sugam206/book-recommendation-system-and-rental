'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';
import { TrendingUp, BookOpen, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

interface IncomingRent {
    _id: string;
    userId: { username: string; email: string };
    providerId?: { username: string; email: string } | null;
    bookId: { title: string; authorName: string; price: number };
    depositAmount: number;
    rentStartDate: string;
    rentEndDate: string;
    status: 'deposit_held' | 'provider_accepted' | 'refund_pending' | 'active' | 'completed' | 'refunded' | 'cancelled';
    providerDecision: 'pending' | 'accepted' | 'rejected';
    paymentStatus: 'held' | 'released' | 'refund_pending' | 'refunded' | 'pending';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const RentPage = () => {
    const router = useRouter();
    const { user: profileUser } = useSelector((state: RootState) => state.profile);
    const { user: authUser, token } = useSelector((state: RootState) => state.auth);
    const rentalStatus = profileUser?.rentalStatus || 'inactive';
    const [incomingRents, setIncomingRents] = useState<IncomingRent[]>([]);
    const [incomingLoading, setIncomingLoading] = useState(false);
    const [actioningRentId, setActioningRentId] = useState('');

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
            fetchIncomingRents();
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

    const fetchIncomingRents = async () => {
        if (!token) return;

        try {
            setIncomingLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/rents/provider/incoming`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIncomingRents(response.data?.rents || []);
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            toast.error(message || 'Failed to load incoming rental requests');
        } finally {
            setIncomingLoading(false);
        }
    };

    const handleProviderDecision = async (rentId: string, decision: 'accepted' | 'rejected') => {
        if (!token) return;

        try {
            setActioningRentId(rentId);
            const response = await axios.put(
                `${API_BASE_URL}/api/rents/${rentId}/provider-decision`,
                { decision },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(response.data?.message || `Request ${decision}`);
            await fetchIncomingRents();
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            toast.error(message || 'Failed to update rental request');
        } finally {
            setActioningRentId('');
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
                            <p className="text-3xl font-bold text-gray-900">{incomingRents.filter((rent) => rent.status === 'active').length}</p>
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
                            <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
                            <p className="text-3xl font-bold text-gray-900">{incomingRents.filter((rent) => rent.providerDecision === 'pending').length}</p>
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
                            <p className="text-sm text-gray-600 mb-1">Awaiting Release</p>
                            <p className="text-3xl font-bold text-gray-900">Rs. {incomingRents.filter((rent) => rent.status === 'active').reduce((sum, rent) => sum + (rent.depositAmount || 0), 0)}</p>
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
                            <p className="text-sm text-gray-600 mb-1">Total Released</p>
                            <p className="text-3xl font-bold text-gray-900">Rs. {incomingRents.filter((rent) => rent.paymentStatus === 'released').reduce((sum, rent) => sum + (rent.depositAmount || 0), 0)}</p>
                        </div>
                        <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Rentals */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Incoming Rental Requests</h2>

                {incomingLoading ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-600">
                        Loading rental requests...
                    </div>
                ) : incomingRents.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            No rental requests yet. When users deposit and request your books, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left">Renter</th>
                                    <th className="px-4 py-3 text-left">Book</th>
                                    <th className="px-4 py-3 text-left">Deposit</th>
                                    <th className="px-4 py-3 text-left">Period</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomingRents.map((rent) => (
                                    <tr key={rent._id} className="border-b">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{rent.userId.username}</div>
                                            <div className="text-sm text-gray-500">{rent.userId.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{rent.bookId.title}</div>
                                            <div className="text-sm text-gray-500">{rent.bookId.authorName}</div>
                                            {rent.providerId?.username && (
                                                <div className="text-xs text-gray-400">Assigned to {rent.providerId.username}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium">Rs. {rent.depositAmount}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(rent.rentStartDate).toLocaleDateString()} - {new Date(rent.rentEndDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                                                {rent.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {rent.providerDecision === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleProviderDecision(rent._id, 'accepted')}
                                                        disabled={actioningRentId === rent._id}
                                                        className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        Accept
                                                    </button>
                                                    {rent.providerId && (
                                                        <button
                                                            onClick={() => handleProviderDecision(rent._id, 'rejected')}
                                                            disabled={actioningRentId === rent._id}
                                                            className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">Waiting for next step</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
