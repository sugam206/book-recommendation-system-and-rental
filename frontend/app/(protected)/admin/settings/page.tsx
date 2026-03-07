'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';

export default function AdminSettingsPage() {
  const { user } = useSelector((s: RootState) => s.auth);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <div className="rounded bg-white p-6 shadow">
        <p className="text-gray-700">Logged in as <strong>{user?.username}</strong> ({user?.email}).</p>
        <p className="mt-2 text-sm text-gray-500">System-level settings can be added here (security policies, notifications, limits).</p>
      </div>
    </div>
  );
}
