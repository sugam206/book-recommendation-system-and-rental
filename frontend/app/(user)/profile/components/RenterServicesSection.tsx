'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { fetchCurrentRequest } from '@/app/reduxToolkit/rentalRequestSlice';
import RentalRequestInlineForm from './RentalRequestInlineForm';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const RenterServicesSection: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    const { user: profileUser } = useSelector((state: RootState) => state.profile);
    const { currentRequest, sections } = useSelector((state: RootState) => state.rentalRequest);
    const [showInlineForm, setShowInlineForm] = useState(false);
    const [lastFetch, setLastFetch] = useState(0);

    const isLoading = sections.fetchRequest.loading;
    const error = sections.fetchRequest.error;
    const effectiveRentalStatus = currentRequest?.status || profileUser?.rentalStatus || 'inactive';

    // Fetch rental request status on mount
    useEffect(() => {
        if (token && Date.now() - lastFetch > 5000) {
            dispatch(fetchCurrentRequest(token));
            setLastFetch(Date.now());
        }
    }, [dispatch, token, lastFetch]);

    const getStatusIcon = () => {
        switch (effectiveRentalStatus) {
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = () => {
        switch (effectiveRentalStatus) {
            case 'approved':
                return 'bg-green-50 border-green-200';
            case 'pending':
                return 'bg-yellow-50 border-yellow-200';
            case 'rejected':
                return 'bg-red-50 border-red-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusText = () => {
        switch (effectiveRentalStatus) {
            case 'approved':
                return 'Request Approved - You can now provide rental services!';
            case 'pending':
                return 'Request Pending - Your application is being reviewed by our admin team.';
            case 'rejected':
                return 'Request Rejected - Please review admin feedback and try again.';
            default:
                return 'Ready to provide rental services? Click below to submit your request.';
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Rental Services</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage your rental service application and status
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Status Card */}
                    <div className={`border rounded-lg p-4 flex items-start gap-3 ${getStatusColor()}`}>
                        {getStatusIcon()}
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 capitalize">{effectiveRentalStatus}</p>
                            <p className="text-sm text-gray-700 mt-1">{getStatusText()}</p>
                        </div>
                    </div>

                    {/* Request Details (if exists) */}
                    {currentRequest && effectiveRentalStatus !== 'inactive' && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold">Business Name</p>
                                <p className="text-gray-900">{currentRequest.businessName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold">Experience Level</p>
                                <p className="text-gray-900 capitalize">{currentRequest.experienceLevel}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase font-semibold">Request Date</p>
                                <p className="text-gray-900">
                                    {new Date(currentRequest.requestDate).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Admin Notes (if rejected or approved with notes) */}
                            {currentRequest.adminNotes && (
                                <div className="border-t pt-3">
                                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                                        {effectiveRentalStatus === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
                                    </p>
                                    <p className="text-gray-900 text-sm">{currentRequest.adminNotes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Benefits */}
                    {effectiveRentalStatus === 'approved' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">Active Features:</h3>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>✓ List and manage your books for rent</li>
                                <li>✓ Earn money by renting books to other users</li>
                                <li>✓ Track rental history and earnings</li>
                                <li>✓ Access the rental dashboard at /rent</li>
                            </ul>
                        </div>
                    )}

                    {effectiveRentalStatus === 'inactive' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">Get Started:</h3>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>✓ Submit your rental service request</li>
                                <li>✓ Wait for admin approval</li>
                                <li>✓ Start renting books and earning money</li>
                            </ul>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {effectiveRentalStatus === 'inactive' && (
                            <button
                                onClick={() => setShowInlineForm((prev) => !prev)}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-medium"
                            >
                                {showInlineForm ? 'Hide Form' : 'Request Rental Services'}
                            </button>
                        )}

                        {effectiveRentalStatus === 'pending' && (
                            <button
                                disabled
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded font-medium cursor-not-allowed"
                            >
                                Waiting for Review...
                            </button>
                        )}

                        {effectiveRentalStatus === 'rejected' && (
                            <button
                                onClick={() => setShowInlineForm((prev) => !prev)}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-medium"
                            >
                                {showInlineForm ? 'Hide Form' : 'Submit New Request'}
                            </button>
                        )}

                        {effectiveRentalStatus === 'approved' && (
                            <button
                                onClick={() => window.location.href = '/rent'}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-medium"
                            >
                                Go to Rental Dashboard
                            </button>
                        )}
                    </div>

                    {isLoading && (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        </div>
                    )}

                    {(effectiveRentalStatus === 'inactive' || effectiveRentalStatus === 'rejected') && showInlineForm && (
                        <RentalRequestInlineForm
                            onCancel={() => setShowInlineForm(false)}
                            onSuccess={() => {
                                setShowInlineForm(false);
                                if (token) {
                                    dispatch(fetchCurrentRequest(token));
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default RenterServicesSection;

