'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';

interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeRentals: number;
  overdueRentals: number;
  monthlyRevenue: number;
  newUsersThisMonth: number;
}

export default function AnalyticsPage() {
  const { token } = useSelector((s: RootState) => s.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded bg-white p-4 shadow">Total Books: <strong>{stats?.totalBooks ?? 0}</strong></div>
        <div className="rounded bg-white p-4 shadow">Total Users: <strong>{stats?.totalUsers ?? 0}</strong></div>
        <div className="rounded bg-white p-4 shadow">Active Rentals: <strong>{stats?.activeRentals ?? 0}</strong></div>
        <div className="rounded bg-white p-4 shadow">Overdue Rentals: <strong>{stats?.overdueRentals ?? 0}</strong></div>
        <div className="rounded bg-white p-4 shadow">Monthly Revenue: <strong>Rs. {stats?.monthlyRevenue ?? 0}</strong></div>
        <div className="rounded bg-white p-4 shadow">New Users This Month: <strong>{stats?.newUsersThisMonth ?? 0}</strong></div>
      </div>
    </div>
  );
}
