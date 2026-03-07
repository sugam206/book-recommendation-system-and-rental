'use client';

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { uploadProfilePicture, deleteProfilePicture } from '@/app/reduxToolkit/profileSlice';
import ProfileSectionHeader from './ProfileSectionHeader';
import { Upload, Trash2 } from 'lucide-react';

const ProfilePictureSection: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, sections } = useSelector((state: RootState) => state.profile);
    const { token } = useSelector((state: RootState) => state.auth);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string>('');

    const isLoading = sections.profilePicture.loading;
    const apiError = sections.profilePicture.error;

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const validateFile = (file: File): boolean => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!validTypes.includes(file.type)) {
            setError('Only JPEG, PNG, and WebP images are allowed');
            return false;
        }

        if (file.size > maxSize) {
            setError('File size must not exceed 2MB');
            return false;
        }

        return true;
    };

    const createPreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            if (validateFile(file)) {
                setError('');
                createPreview(file);
                setSelectedFile(file);

                // also populate hidden file input so handleUpload can use it if needed
                if (fileInputRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInputRef.current.files = dt.files;
                }
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setError('');
            createPreview(file);
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if ((!preview && !selectedFile) || !token) {
            // nothing to upload
            return;
        }

        // prefer the file saved in state, fallback to input ref
        let fileToSend: File | null = selectedFile;
        if (!fileToSend && fileInputRef.current && fileInputRef.current.files?.[0]) {
            fileToSend = fileInputRef.current.files[0];
        }
        if (!fileToSend) return;

        const formData = new FormData();
        formData.append('picture', fileToSend);

        const result = await dispatch(uploadProfilePicture({ formData, token }));
        if (result.meta.requestStatus === 'fulfilled') {
            setPreview(null);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (!token || !user?.profilePicture) return;
        await dispatch(deleteProfilePicture(token));
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <ProfileSectionHeader
                title="Profile Picture"
                description="Upload or update your profile picture"
            />

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {apiError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {apiError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Picture */}
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Current Picture</p>
                    <div className="w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {user?.profilePicture ? (
                            <img
                                src={`http://localhost:5000/${user.profilePicture}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-gray-400 text-center">
                                <p className="text-4xl mb-2">📷</p>
                                <p>No picture yet</p>
                            </div>
                        )}
                    </div>
                    {user?.profilePicture && (
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="mt-3 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>

                {/* Upload Area */}
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        {preview ? 'Preview' : 'Upload New Picture'}
                    </p>

                    {!preview ? (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${isDragActive
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-700 font-medium mb-1">
                                Drag and drop your image here
                            </p>
                            <p className="text-gray-500 text-sm mb-3">or</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                            >
                                Choose File
                            </button>
                            <p className="text-gray-500 text-xs mt-3">
                                Max size: 2MB | Formats: JPEG, PNG, WebP
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                    Upload
                                </button>
                                <button
                                    onClick={() => {
                                        setPreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePictureSection;
