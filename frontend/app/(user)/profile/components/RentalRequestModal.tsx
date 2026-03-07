'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { submitRentalRequest } from '@/app/reduxToolkit/rentalRequestSlice';
import { X } from 'lucide-react';

interface RentalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const RentalRequestModal: React.FC<RentalRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    const { user } = useSelector((state: RootState) => state.profile);
    const { sections } = useSelector((state: RootState) => state.rentalRequest);

    const [formData, setFormData] = useState({
        businessName: '',
        businessDescription: '',
        experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'expert',
        rentalTermsPreference: ''
    });

    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    const isLoading = sections.submitRequest.loading;
    const error = sections.submitRequest.error;

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!formData.businessName.trim()) {
            errors.businessName = 'Business name is required';
        } else if (formData.businessName.length < 3) {
            errors.businessName = 'Business name must be at least 3 characters';
        }

        if (!formData.businessDescription.trim()) {
            errors.businessDescription = 'Business description is required';
        } else if (formData.businessDescription.length < 20) {
            errors.businessDescription = 'Description must be at least 20 characters';
        }

        if (!formData.rentalTermsPreference.trim()) {
            errors.rentalTermsPreference = 'Rental terms preference is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (
        field: keyof typeof formData,
        value: string
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
        setShowConfirmation(true);
    };

    const handleConfirmSubmit = async () => {
        if (!token) return;

        const result = await dispatch(submitRentalRequest({ data: formData, token }));
        if (result.meta.requestStatus === 'fulfilled') {
            setShowConfirmation(false);
            setFormData({
                businessName: '',
                businessDescription: '',
                experienceLevel: 'beginner',
                rentalTermsPreference: ''
            });
            onClose();
            onSuccess?.();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b flex items-center justify-between p-6">
                    <h2 className="text-2xl font-bold text-gray-900">Request Rental Services</h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {!showConfirmation ? (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Fill out the form below to apply for rental services. Your application will be reviewed by our admin team.
                            </p>

                            {/* Business Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Business Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                                    placeholder="e.g., John's Book Collection"
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                {validationErrors.businessName && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.businessName}</p>
                                )}
                            </div>

                            {/* Business Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Business Description *
                                </label>
                                <textarea
                                    value={formData.businessDescription}
                                    onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                                    placeholder="Describe your book collection, target audience, and rental experience..."
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                />
                                {validationErrors.businessDescription && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.businessDescription}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Minimum 20 characters
                                </p>
                            </div>

                            {/* Experience Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Experience Level *
                                </label>
                                <select
                                    value={formData.experienceLevel}
                                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="beginner">Beginner - New to renting books</option>
                                    <option value="intermediate">Intermediate - Some rental experience</option>
                                    <option value="expert">Expert - Experienced book renter</option>
                                </select>
                            </div>

                            {/* Rental Terms Preference */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rental Terms Preference *
                                </label>
                                <textarea
                                    value={formData.rentalTermsPreference}
                                    onChange={(e) => handleInputChange('rentalTermsPreference', e.target.value)}
                                    placeholder="e.g., '7-day rental period, $2 per book, $5 deposit required'"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                />
                                {validationErrors.rentalTermsPreference && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.rentalTermsPreference}</p>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Note:</strong> Make sure you have completed your profile with a profile picture before submitting this request.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-900 mb-4">
                                    Please review your rental service request before submitting:
                                </p>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Business Name:</p>
                                        <p className="font-medium text-gray-900">{formData.businessName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Description:</p>
                                        <p className="font-medium text-gray-900">{formData.businessDescription}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Experience Level:</p>
                                        <p className="font-medium text-gray-900 capitalize">{formData.experienceLevel}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Rental Terms:</p>
                                        <p className="font-medium text-gray-900">{formData.rentalTermsPreference}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    Your request will be reviewed by our admin team. You'll receive an email when it's approved or if we need more information.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition font-medium disabled:opacity-50"
                    >
                        {showConfirmation ? 'Back' : 'Cancel'}
                    </button>
                    {!showConfirmation ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleConfirmSubmit}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isLoading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentalRequestModal;
