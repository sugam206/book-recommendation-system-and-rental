'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminBookEditPage() {
  const { token } = useSelector((s: RootState) => s.auth);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState({ title: '', authorName: '', publishedDate: '', pages: '', description: '', genre: '', tags: '' });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!token || !id) return;
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/books/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const b = res.data?.book;
        setForm({
          title: b?.title || '',
          authorName: b?.authorName || '',
          publishedDate: b?.publishedDate ? String(b.publishedDate).slice(0, 10) : '',
          pages: b?.pages ? String(b.pages) : '',
          description: b?.description || '',
          genre: Array.isArray(b?.genre) ? b.genre.join(', ') : '',
          tags: Array.isArray(b?.tags) ? b.tags.join(', ') : '',
        });
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load book');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError('');
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('authorName', form.authorName);
      fd.append('publishedDate', form.publishedDate);
      fd.append('pages', form.pages);
      fd.append('description', form.description);
      fd.append('genre', form.genre);
      fd.append('tags', form.tags);
      if (image) fd.append('image', image);
      await axios.put(`${API_BASE}/books/${id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      router.push(`/admin/books/${id}`);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update book');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">Edit Book</h1>
      {error && <p className="text-red-600">{error}</p>}
      <input className="w-full rounded border px-3 py-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
      <input className="w-full rounded border px-3 py-2" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="Author" />
      <input type="date" className="w-full rounded border px-3 py-2" value={form.publishedDate} onChange={(e) => setForm({ ...form, publishedDate: e.target.value })} />
      <input type="number" className="w-full rounded border px-3 py-2" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} placeholder="Pages" />
      <input className="w-full rounded border px-3 py-2" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Genre (comma separated)" />
      <input className="w-full rounded border px-3 py-2" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma separated)" />
      <textarea className="w-full rounded border px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={4} />
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
      <button disabled={saving} className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
    </form>
  );
}
