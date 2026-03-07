'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { getRequestDetails, approveRentalRequest, rejectRentalRequest } from '@/app/reduxToolkit/rentalRequestSlice';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const RentalRequestDetailPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const params = useParams();
    const requestId = params.id as string;

    const { token, user } = useSelector((state: RootState) => state.auth);
    const { currentRequest, sections } = useSelector((state: RootState) => state.rentalRequest);
    const [adminNotes, setAdminNotes] = useState('');
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [confirmAction, setConfirmAction] = useState(false);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/profile');
        }
    }, [user, router]);

    useEffect(() => {
        if (token && requestId) {
            dispatch(getRequestDetails({ requestId, token }));
        }
    }, [dispatch, token, requestId]);

    const isLoadingDetail = sections.fetchRequest.loading;
    const isLoadingApprove = sections.adminApprove.loading;
    const isLoadingReject = sections.adminReject.loading;
    const isLoading = isLoadingApprove || isLoadingReject;

    const handleApprove = async () => {
        if (!token || !requestId) return;
        const result = await dispatch(approveRentalRequest({
            requestId,
            adminNotes,
            token
        }));
        if (result.meta.requestStatus === 'fulfilled') {
            setConfirmAction(false);
            setActionType(null);
            setTimeout(() => router.push('/admin/rental-requests?status=approved'), 1500);
        }
    };

    const handleReject = async () => {
        if (!token || !requestId || !adminNotes.trim()) return;
        const result = await dispatch(rejectRentalRequest({
            requestId,
            adminNotes,
            token
        }));
        if (result.meta.requestStatus === 'fulfilled') {
            setConfirmAction(false);
            setActionType(null);
            setTimeout(() => router.push('/admin/rental-requests?status=rejected'), 1500);
        }
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
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Requests
            </button>

            {isLoadingDetail ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : currentRequest ? (
                <>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{currentRequest.businessName}</h1>
                                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${currentRequest.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : currentRequest.status === 'approved'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                        {currentRequest.status.charAt(0).toUpperCase() + currentRequest.status.slice(1)}
                                    </span>
                                </div>
                                <p className="text-gray-600">Requested on {new Date(currentRequest.requestDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 py-6 border-t border-b">
                            <div>
                                <p className="text-sm text-gray-600 uppercase font-semibold mb-2">Experience Level</p>
                                <p className="text-lg text-gray-900 capitalize">{currentRequest.experienceLevel}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 uppercase font-semibold mb-2">Status</p>
                                <p className="text-lg text-gray-900 capitalize">{currentRequest.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 uppercase font-semibold mb-2">Request Date</p>
                                <p className="text-lg text-gray-900">{new Date(currentRequest.requestDate).toLocaleDateString()}</p>
                            </div>
                            {currentRequest.reviewedDate && (
                                <div>
                                    <p className="text-sm text-gray-600 uppercase font-semibold mb-2">Reviewed Date</p>
                                    <p className="text-lg text-gray-900">{new Date(currentRequest.reviewedDate).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Business Description</h2>
                        <p className="text-gray-700 leading-relaxed">{currentRequest.businessDescription}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Rental Terms Preference</h2>
                        <p className="text-gray-700 leading-relaxed">{currentRequest.rentalTermsPreference}</p>
                    </div>

                    {currentRequest.adminNotes && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Admin Notes</h2>
                            <p className="text-gray-700 leading-relaxed">{currentRequest.adminNotes}</p>
                        </div>
                    )}

                    {currentRequest.status === 'pending' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Review</h2>

                            {!confirmAction ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Admin Notes (Optional for approval, Required for rejection)
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Add notes about this request..."
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setActionType('approve');
                                                setConfirmAction(true);
                                            }}
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Approve Request
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActionType('reject');
                                                setConfirmAction(true);
                                            }}
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Reject Request
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                    <p className="font-medium text-gray-900 mb-4">
                                        {actionType === 'approve'
                                            ? 'Are you sure you want to APPROVE this rental request?'
                                            : 'Are you sure you want to REJECT this rental request?'}
                                    </p>
                                    {actionType === 'reject' && !adminNotes.trim() && (
                                        <p className="text-sm text-red-600 mb-4">
                                            Admin notes are required for rejection.
                                        </p>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmAction(false)}
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition font-medium disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={actionType === 'approve' ? handleApprove : handleReject}
                                            disabled={isLoading || (actionType === 'reject' && !adminNotes.trim())}
                                            className={`flex-1 px-4 py-2 text-white rounded transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${actionType === 'approve'
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : 'bg-red-500 hover:bg-red-600'
                                                }`}
                                        >
                                            {isLoading && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            )}
                                            {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-600">Request not found</p>
                </div>
            )}
        </div>
    );
};

export default RentalRequestDetailPage;
