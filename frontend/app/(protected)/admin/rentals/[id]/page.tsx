'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000/api';

export default function AdminRentalDetailPage() {
  const { token } = useSelector((s: RootState) => s.auth);
  const params = useParams();
  const id = params.id as string;

  const [rent, setRent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!token || !id) return;
      try {
        const res = await axios.get(`${API_BASE}/rents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setRent(res.data?.rent || null);
      } catch (e: unknown) {
        const message = axios.isAxiosError(e) ? e.response?.data?.message : undefined;
        setError(message || 'Failed to load rent');
        toast.error(message || 'Failed to load rent');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, token]);

  const runAction = async (path: string, body?: Record<string, unknown>) => {
    if (!token || !id) return;
    try {
      setSaving(true);
      const response = await axios.put(`${API_BASE}/rents/${id}/${path}`, body || {}, { headers: { Authorization: `Bearer ${token}` } });
      const refreshed = await axios.get(`${API_BASE}/rents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRent(refreshed.data?.rent || null);
      setError('');
      toast.success(response.data?.message || 'Rental updated successfully');
    } catch (e: unknown) {
      const message = axios.isAxiosError(e) ? e.response?.data?.message : undefined;
      setError(message || 'Failed to update rent status');
      toast.error(message || 'Failed to update rent status');
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
      <p><span className="font-semibold">Provider:</span> {rent.providerId?.username} ({rent.providerId?.email})</p>
      <p><span className="font-semibold">Book:</span> {rent.bookId?.title}</p>
      <p><span className="font-semibold">Period:</span> {new Date(rent.rentStartDate).toLocaleDateString()} - {new Date(rent.rentEndDate).toLocaleDateString()}</p>
      <p><span className="font-semibold">Deposit:</span> Rs. {rent.depositAmount ?? rent.amount}</p>
      <p><span className="font-semibold">Status:</span> {rent.status}</p>
      <p><span className="font-semibold">Payment Status:</span> {rent.paymentStatus}</p>
      <p><span className="font-semibold">Provider Decision:</span> {rent.providerDecision}</p>
      <p><span className="font-semibold">Admin Decision:</span> {rent.adminDecision}</p>
      {rent.refundDueAt && <p><span className="font-semibold">Refund Due By:</span> {new Date(rent.refundDueAt).toLocaleString()}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {rent.providerDecision === 'pending' && (
          <>
            <button onClick={() => runAction('provider-decision', { decision: 'accepted' })} disabled={saving} className="rounded bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Accept as Provider'}
            </button>
            <button onClick={() => runAction('provider-decision', { decision: 'rejected' })} disabled={saving} className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Reject and Queue Refund'}
            </button>
          </>
        )}
        {rent.status === 'provider_accepted' && (
          <button onClick={() => runAction('admin-confirm-start')} disabled={saving} className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Admin Confirm Start'}
          </button>
        )}
        {rent.status === 'active' && (
          <button onClick={() => runAction('admin-confirm-completion')} disabled={saving} className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Admin Release Deposit'}
          </button>
        )}
        {rent.paymentStatus === 'refund_pending' && (
          <button onClick={() => runAction('admin-refund')} disabled={saving} className="rounded bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Admin Process Refund'}
          </button>
        )}
      </div>
    </div>
  );
}
