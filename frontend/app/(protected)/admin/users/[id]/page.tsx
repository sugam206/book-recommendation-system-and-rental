'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminUserDetailPage() {
  const { token } = useSelector((s: RootState) => s.auth);
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!token || !id) return;
      try {
        const res = await axios.get(`${API_BASE}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data?.user || null);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, token]);

  if (loading) return <div className="p-6">Loading user...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!user) return <div className="p-6">User not found.</div>;

  return (
    <div className="max-w-2xl space-y-3 rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">User Details</h1>
      <p><span className="font-semibold">Username:</span> {user.username}</p>
      <p><span className="font-semibold">Email:</span> {user.email}</p>
      <p><span className="font-semibold">Role:</span> {user.role}</p>
      <p><span className="font-semibold">Rental Status:</span> {user.rentalStatus || 'inactive'}</p>
      <p><span className="font-semibold">Member Since:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
}
