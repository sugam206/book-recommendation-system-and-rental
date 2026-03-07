'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import { Calendar, Book, TrendingUp, DollarSign } from 'lucide-react';

const AccountStatsSection: React.FC = () => {
    const { user, statistics } = useSelector((state: RootState) => state.profile);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const stats = [
        {
            icon: Calendar,
            label: 'Member Since',
            value: formatDate(statistics?.memberSince),
            color: 'bg-blue-100 text-blue-600'
        },
        {
            icon: Book,
            label: 'Books Borrowed',
            value: statistics?.booksBorrowed || 0,
            color: 'bg-green-100 text-green-600'
        },
        {
            icon: TrendingUp,
            label: 'Books Lent',
            value: statistics?.booksLent || 0,
            color: 'bg-orange-100 text-orange-600'
        },
        {
            icon: DollarSign,
            label: 'Total Earnings',
            value: `$${(statistics?.totalEarnings || 0).toFixed(2)}`,
            color: 'bg-purple-100 text-purple-600'
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Statistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Account ID</p>
                        <p className="text-gray-900 font-mono text-sm break-all">{user?.id}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="text-gray-900 capitalize font-medium">
                            Regular User
                        </p>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="mt-6 pt-6 border-t bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Tips</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Add a profile picture to make your account more recognizable</li>
                    <li>• Enable rent services to start lending books and earning money</li>
                    <li>• Keep your contact information up to date</li>
                    <li>• Change your password regularly for security</li>
                </ul>
            </div>
        </div>
    );
};

export default AccountStatsSection;
