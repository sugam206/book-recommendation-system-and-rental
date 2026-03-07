'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminRentalDetailPage() {
  const { token } = useSelector((s: RootState) => s.auth);
  const params = useParams();
  const id = params.id as string;

  const [rent, setRent] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!token || !id) return;
      try {
        const res = await axios.get(`${API_BASE}/rents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setRent(res.data?.rent || null);
        setStatus(res.data?.rent?.status || '');
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load rent');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, token]);

  const updateStatus = async () => {
    if (!token || !id) return;
    try {
      setSaving(true);
      await axios.put(`${API_BASE}/rents/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      const refreshed = await axios.get(`${API_BASE}/rents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRent(refreshed.data?.rent || null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update rent status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading rental...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!rent) return <div className="p-6">Rental not found.</div>;

  return (
    <div className="max-w-3xl space-y-4 rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">Rental Detail</h1>
      <p><span className="font-semibold">User:</span> {rent.userId?.username} ({rent.userId?.email})</p>
      <p><span className="font-semibold">Book:</span> {rent.bookId?.title}</p>
      <p><span className="font-semibold">Period:</span> {new Date(rent.rentStartDate).toLocaleDateString()} - {new Date(rent.rentEndDate).toLocaleDateString()}</p>
      <p><span className="font-semibold">Amount:</span> Rs. {rent.amount}</p>
      <div className="flex items-center gap-2">
        <label className="font-semibold">Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-2 py-1">
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button onClick={updateStatus} disabled={saving} className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Update'}
        </button>
      </div>
    </div>
  );
}
