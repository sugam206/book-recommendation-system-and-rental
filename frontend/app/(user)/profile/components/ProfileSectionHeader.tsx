'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProfileSectionHeaderProps {
    title: string;
    description?: string;
    isOpen?: boolean;
    onToggle?: () => void;
    isEditing?: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
    onSave?: () => void;
    isLoading?: boolean;
}

const ProfileSectionHeader: React.FC<ProfileSectionHeaderProps> = ({
    title,
    description,
    isOpen = true,
    onToggle,
    isEditing = false,
    onEdit,
    onCancel,
    onSave,
    isLoading = false,
}) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    {onToggle && (
                        <button
                            onClick={onToggle}
                            className="p-1 hover:bg-gray-100 rounded transition"
                        >
                            {isOpen ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                    )}
                </div>
                {description && (
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
            </div>

            {/* Action Buttons */}
            {isEditing ? (
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isLoading}
                        className="px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Save
                    </button>
                </div>
            ) : (
                onEdit && (
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded transition"
                    >
                        Edit
                    </button>
                )
            )}
        </div>
    );
};

export default ProfileSectionHeader;
