'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/reduxToolkit/store';
import { fetchProfileData } from '@/app/reduxToolkit/profileSlice';
import BasicInfoSection from './components/BasicInfoSection';
import PasswordSection from './components/PasswordSection';
import ProfilePictureSection from './components/ProfilePictureSection';
import RenterServicesSection from './components/RenterServicesSection';
import AccountStatsSection from './components/AccountStatsSection';
import { logout } from '@/app/reduxToolkit/authSlice';

const ProfilePage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    const { user, statistics, sections } = useSelector((state: RootState) => state.profile);
    useEffect(() => {
        if (token) {
            dispatch(fetchProfileData(token));
        }
    }, [dispatch, token]);

    const isLoadingStats = sections.stats.loading;
    const statsError = sections.stats.error;

    if (statsError) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {statsError}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
                <p className="text-gray-600">Manage your account and settings</p>
            </div>

            {isLoadingStats ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <>
                    {/* Profile Picture Section */}
                    <ProfilePictureSection />

                    {/* Divider */}
                    <hr className="my-8" />

                    {/* Basic Info Section */}
                    <BasicInfoSection />

                    {/* Divider */}
                    <hr className="my-8" />

                    {/* Password Section */}
                    <PasswordSection />

                    {/* Divider */}
                    <hr className="my-8" />

                    {/* Renter Services Section */}
                    <RenterServicesSection />

                    {/* Divider */}
                    <hr className="my-8" />

                    {/* Account Statistics Section */}
                    <AccountStatsSection />
                </>

            )}
            <button onClick={() => dispatch(logout())} className="mt-8 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Logout
            </button>
        </div>
    );
};

export default ProfilePage;