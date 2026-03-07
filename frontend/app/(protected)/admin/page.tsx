'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store'; // adjust path if needed

interface DashboardStats {
    totalBooks: number;
    totalUsers: number;
    activeRentals: number;
    overdueRentals: number;
    monthlyRevenue: number;
    newUsersThisMonth: number;
}

interface RecentActivity {
    type: 'book' | 'user' | 'rental';
    description: string;
    time: string;
}

export default function AdminDashboard() {
    const { token, user } = useSelector((state: RootState) => state.auth);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            fetchDashboardData();
        } else {
            setError("Unauthorized. Please login.");
            setLoading(false);
        }
    }, [token]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [statsRes, activitiesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/stats', { headers }),
                axios.get('http://localhost:5000/api/admin/activities', { headers })
            ]);

            setStats(statsRes.data);
            setRecentActivities(activitiesRes.data);

        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load dashboard data"
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 text-red-700 p-4 rounded">
                {error}
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Books',
            value: stats?.totalBooks || 0,
            icon: '📚',
            color: 'bg-blue-500',
            link: '/admin/books'
        },
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: '👥',
            color: 'bg-green-500',
            link: '/admin/users'
        },
        {
            title: 'Active Rentals',
            value: stats?.activeRentals || 0,
            icon: '📖',
            color: 'bg-yellow-500',
            link: '/admin/rentals'
        },
        {
            title: 'Overdue Rentals',
            value: stats?.overdueRentals || 0,
            icon: '⚠️',
            color: 'bg-red-500',
            link: '/admin/rentals?status=overdue'
        },
        {
            title: 'Monthly Revenue',
            value: `$${stats?.monthlyRevenue || 0}`,
            icon: '💰',
            color: 'bg-purple-500',
            link: '/admin/analytics'
        },
        {
            title: 'New Users (Month)',
            value: stats?.newUsersThisMonth || 0,
            icon: '👤',
            color: 'bg-indigo-500',
            link: '/admin/users'
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">
                Welcome {user?.username || "Admin"}
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        href={stat.link}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                <p className="text-2xl font-bold">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} text-white p-3 rounded-full text-2xl`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
                <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 border-b pb-3 last:border-0">
                            <div className={`w-2 h-2 rounded-full ${activity.type === 'book' ? 'bg-blue-500' :
                                activity.type === 'user' ? 'bg-green-500' :
                                    activity.type === 'rental' ? 'bg-yellow-500' :
                                        'bg-gray-500'
                                }`} />
                            <div className="flex-1">
                                <p className="text-sm">{activity.description}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}