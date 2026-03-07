'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { changePassword } from '@/app/reduxToolkit/profileSlice';
import ProfileSectionHeader from './ProfileSectionHeader';
import { Eye, EyeOff } from 'lucide-react';

const PasswordSection: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { sections } = useSelector((state: RootState) => state.profile);
    const { token } = useSelector((state: RootState) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [successMessage, setSuccessMessage] = useState('');

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!formData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        if (formData.newPassword.length < 8) {
            errors.newPassword = 'New password must be at least 8 characters';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEdit = () => {
        setIsEditing(true);
        setValidationErrors({});
        setSuccessMessage('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setValidationErrors({});
        setSuccessMessage('');
    };

    const handleSave = async () => {
        if (!validateForm() || !token) return;

        const result = await dispatch(
            changePassword({
                data: {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword
                },
                token
            })
        );

        if (result.meta.requestStatus === 'fulfilled') {
            setSuccessMessage('Password changed successfully');
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setIsEditing(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const isLoading = sections.password.loading;
    const error = sections.password.error;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <ProfileSectionHeader
                title="Change Password"
                description="Update your password for security"
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

            {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMessage}
                </div>
            )}

            {!isEditing && !successMessage && (
                <p className="text-gray-600 text-sm">
                    Click Edit to change your password
                </p>
            )}

            {isEditing && (
                <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                className="absolute right-3 top-2.5"
                            >
                                {showPasswords.current ? (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <Eye className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {validationErrors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.currentPassword}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-2.5"
                            >
                                {showPasswords.new ? (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <Eye className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {validationErrors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-2.5"
                            >
                                {showPasswords.confirm ? (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <Eye className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {validationErrors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordSection;
