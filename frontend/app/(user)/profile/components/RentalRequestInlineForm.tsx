'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { submitRentalRequest } from '@/app/reduxToolkit/rentalRequestSlice';

interface RentalRequestInlineFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const RentalRequestInlineForm: React.FC<RentalRequestInlineFormProps> = ({ onSuccess, onCancel }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    const { sections } = useSelector((state: RootState) => state.rentalRequest);

    const [formData, setFormData] = useState({
        businessName: '',
        businessDescription: '',
        experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'expert',
        rentalTermsPreference: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isLoading = sections.submitRequest.loading;
    const submitError = sections.submitRequest.error;

    const onChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!formData.businessName.trim()) next.businessName = 'Business name is required';
        if (!formData.businessDescription.trim()) next.businessDescription = 'Business description is required';
        if (formData.businessDescription.trim().length < 20) next.businessDescription = 'Minimum 20 characters';
        if (!formData.rentalTermsPreference.trim()) next.rentalTermsPreference = 'Rental terms are required';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token || !validate()) return;

        const result = await dispatch(submitRentalRequest({ data: formData, token }));
        if (submitRentalRequest.fulfilled.match(result)) {
            onSuccess?.();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <h3 className="text-base font-semibold text-gray-900">Rental Service Request Form</h3>

            {submitError && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                </div>
            )}

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Business Name *</label>
                <input
                    value={formData.businessName}
                    onChange={(e) => onChange('businessName', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="Your book rental name"
                />
                {errors.businessName && <p className="mt-1 text-xs text-red-600">{errors.businessName}</p>}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Business Description *</label>
                <textarea
                    rows={3}
                    value={formData.businessDescription}
                    onChange={(e) => onChange('businessDescription', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="Describe your collection and service."
                />
                {errors.businessDescription && <p className="mt-1 text-xs text-red-600">{errors.businessDescription}</p>}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Experience Level *</label>
                <select
                    value={formData.experienceLevel}
                    onChange={(e) => onChange('experienceLevel', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                </select>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rental Terms Preference *</label>
                <textarea
                    rows={2}
                    value={formData.rentalTermsPreference}
                    onChange={(e) => onChange('rentalTermsPreference', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="e.g. 7 days, deposit, fine rules"
                />
                {errors.rentalTermsPreference && <p className="mt-1 text-xs text-red-600">{errors.rentalTermsPreference}</p>}
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default RentalRequestInlineForm;

