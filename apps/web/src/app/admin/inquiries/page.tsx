'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_OPTIONS = [
  'ALL',
  'NEW',
  'CONTACTED',
  'NEGOTIATING',
  'VISIT_SCHEDULED',
  'CONVERTED',
  'LOST',
  'CLOSED',
] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

type AdminInquiry = {
  id: string;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    price: number;
    city: string;
  };
  owner: {
    id: string;
    email: string;
    profile: {
      fullName: string;
    };
  };
  renter: {
    id: string;
    email: string;
    profile: {
      fullName: string;
    };
  };
  assignee?: {
    id: string;
    profile: {
      fullName: string;
    };
  };
  budgetMin?: number;
  budgetMax?: number;
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  NEGOTIATING: 'bg-purple-100 text-purple-800',
  VISIT_SCHEDULED: 'bg-indigo-100 text-indigo-800',
  CONVERTED: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export default function AdminInquiriesPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption>('ALL');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isAdmin) return;
    loadInquiries(undefined, true);
  }, [isAdmin, statusFilter]);

  const loadInquiries = async (cursor?: string, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '20');

      const response = await api.get(`/inquiries/admin/list?${params.toString()}`);
      const newData = response.data;

      if (reset) {
        setItems(newData.data || []);
      } else {
        setItems((prev) => [...prev, ...(newData.data || [])]);
      }

      setNextCursor(newData.meta?.nextCursor || null);
      setHasMore(newData.meta?.hasMore || false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inquiries');
    } finally {
      if (reset) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      loadInquiries(nextCursor);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">Only admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Inquiry Moderation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor and review all inquiries across the platform
        </p>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-slate-500">Loading inquiries...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-sm text-slate-600">No inquiries found</p>
        </div>
      )}

      {/* Table */}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Listing</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Renter</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Owner</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Budget</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/inquiries/${inquiry.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {inquiry.listing.title}
                    </Link>
                    <div className="text-xs text-slate-500">{inquiry.listing.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">
                      {inquiry.renter.profile.fullName}
                    </div>
                    <div className="text-xs text-slate-500">{inquiry.renter.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">
                      {inquiry.owner.profile.fullName}
                    </div>
                    <div className="text-xs text-slate-500">{inquiry.owner.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_COLORS[inquiry.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {inquiry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {inquiry.budgetMin && inquiry.budgetMax
                      ? `₹${inquiry.budgetMin} - ₹${inquiry.budgetMax}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/inquiries/${inquiry.id}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg bg-slate-100 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
