'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { getPendingRequests } from '@/app/reduxToolkit/rentalRequestSlice';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const RentalRequestsPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { token, user } = useSelector((state: RootState) => state.auth);
    const { allRequests, sections, pagination } = useSelector((state: RootState) => state.rentalRequest);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/profile');
        }
    }, [user, router]);

    useEffect(() => {
        if (token) {
            dispatch(getPendingRequests({ token, status: activeTab }));
        }
    }, [dispatch, token, activeTab]);

    const isLoading = sections.adminList.loading;
    const error = sections.adminList.error;

    const tabs = ['pending', 'approved', 'rejected'] as const;
    const tabLabels = {
        pending: 'Pending Review',
        approved: 'Approved',
        rejected: 'Rejected'
    };

    const tabIcons = {
        pending: <Clock className="w-5 h-5" />,
        approved: <CheckCircle className="w-5 h-5" />,
        rejected: <XCircle className="w-5 h-5" />
    };

    const tabColors = {
        pending: 'border-yellow-500 text-yellow-600',
        approved: 'border-green-500 text-green-600',
        rejected: 'border-red-500 text-red-600'
    };

    if (user && user.role !== 'admin') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Access Denied:</strong> Only admins can access this page.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Rental Service Requests</h1>
                <p className="text-gray-600">Review and approve user rental service applications</p>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="border-b border-gray-200 flex gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${activeTab === tab
                            ? `${tabColors[tab]} border-current`
                            : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                    >
                        {tabIcons[tab]}
                        {tabLabels[tab as keyof typeof tabLabels]}
                    </button>
                ))}
            </div>

            <div>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : allRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">
                            No {activeTab} rental requests at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {allRequests.map((request) => (
                            <div
                                key={request._id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer"
                                onClick={() => router.push(`/admin/rental-requests/${request._id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{request.businessName}</h3>
                                        <p className="text-sm text-gray-600 capitalize">{request.experienceLevel} level</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${tabColors[activeTab]}`}>
                                        {activeTab === 'pending' && 'Pending'}
                                        {activeTab === 'approved' && 'Approved'}
                                        {activeTab === 'rejected' && 'Rejected'}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                                    {request.businessDescription}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <span className="text-xs text-gray-500">
                                        {new Date(request.requestDate).toLocaleDateString()}
                                    </span>
                                    <button className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1">
                                        View Details -
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            className={`px-3 py-1 rounded ${pagination.page === page
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RentalRequestsPage;
