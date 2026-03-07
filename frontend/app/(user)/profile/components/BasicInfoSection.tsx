'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { updateBasicInfo } from '@/app/reduxToolkit/profileSlice';
import ProfileSectionHeader from './ProfileSectionHeader';

const BasicInfoSection: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, sections } = useSelector((state: RootState) => state.profile);
    const { token } = useSelector((state: RootState) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '' });
    const [originalData, setOriginalData] = useState({ username: '', email: '' });
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (user) {
            setFormData({ username: user.username, email: user.email });
            setOriginalData({ username: user.username, email: user.email });
        }
    }, [user]);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (formData.username.length < 3 || formData.username.length > 30) {
            errors.username = 'Username must be 3-30 characters';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEdit = () => {
        setIsEditing(true);
        setValidationErrors({});
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(originalData);
        setValidationErrors({});
    };

    const handleSave = async () => {
        if (!validateForm() || !token) return;

        const updates: { username?: string; email?: string } = {};
        if (formData.username !== originalData.username) updates.username = formData.username;
        if (formData.email !== originalData.email) updates.email = formData.email;

        if (Object.keys(updates).length === 0) {
            setIsEditing(false);
            return;
        }

        const result = await dispatch(updateBasicInfo({ data: updates, token }));
        if (result.meta.requestStatus === 'fulfilled') {
            setIsEditing(false);
            setOriginalData(formData);
        }
    };

    const handleInputChange = (field: 'username' | 'email', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const isLoading = sections.basicInfo.loading;
    const error = sections.basicInfo.error;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <ProfileSectionHeader
                title="Basic Information"
                description="Update your username and email"
                isEditing={isEditing}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onSave={handleSave}
                isLoading={isLoading}
            />

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Username */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                    </label>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {validationErrors.username && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-700 py-2">{user?.username}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    {isEditing ? (
                        <>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-700 py-2">{user?.email}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BasicInfoSection;
