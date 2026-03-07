'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/reduxToolkit/store';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminBookDetailPage() {
  const { token } = useSelector((s: RootState) => s.auth);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!token || !id) return;
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/books/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBook(res.data?.book || null);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load book');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, token]);

  if (loading) return <div className="p-6">Loading book...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!book) return <div className="p-6">Book not found.</div>;

  return (
    <div className="max-w-4xl space-y-4 rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        <button onClick={() => router.push(`/admin/books/${id}/edit`)} className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700">Edit</button>
      </div>
      <img src={book.image?.startsWith('http') ? book.image : `http://localhost:5000/${book.image}`} alt={book.title} className="h-72 w-52 rounded object-cover" />
      <p><span className="font-semibold">Author:</span> {book.authorName}</p>
      <p><span className="font-semibold">Pages:</span> {book.pages}</p>
      <p><span className="font-semibold">Published:</span> {new Date(book.publishedDate).toLocaleDateString()}</p>
      <p><span className="font-semibold">Genre:</span> {(book.genre || []).join(', ') || '-'}</p>
      <p><span className="font-semibold">Tags:</span> {(book.tags || []).join(', ') || '-'}</p>
      <p><span className="font-semibold">Description:</span> {book.description || '-'}</p>
    </div>
  );
}
