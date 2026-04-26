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

type OwnerInquiry = {
  id: string;
  status: string;
  createdAt: string;
  closedAt?: string;
  listing: {
    id: string;
    title: string;
    price: number;
    city: string;
  };
  renter: {
    id: string;
    email: string;
    profile: {
      fullName: string;
      phone?: string;
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
  message?: string;
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

export default function OwnerInquiriesPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<OwnerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption>('ALL');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    if (!isOwner) return;
    loadInquiries(undefined, true);
  }, [isOwner, statusFilter]);

  const loadInquiries = async (cursor?: string, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '12');

      const response = await api.get(`/inquiries/owner/list?${params.toString()}`);
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

  if (!isOwner) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">Only owners can view inquiries on their listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Inquiries on Your Listings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage inquiries from renters interested in your listings
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

      {/* Inquiries List */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((inquiry) => (
            <Link key={inquiry.id} href={`/inquiries/${inquiry.id}`}>
              <div className="rounded-lg border border-slate-200 bg-white p-4 transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Title and Status */}
                    <div className="flex items-center gap-3">
                      <h3 className="truncate font-semibold text-slate-900">
                        {inquiry.listing.title}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[inquiry.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {inquiry.status}
                      </span>
                    </div>

                    {/* Renter Info */}
                    <div className="mt-2 text-sm text-slate-600">
                      <p>
                        <strong>From:</strong> {inquiry.renter.profile.fullName} ({inquiry.renter.email})
                      </p>
                      {inquiry.renter.profile.phone && (
                        <p>
                          <strong>Phone:</strong> {inquiry.renter.profile.phone}
                        </p>
                      )}
                    </div>

                    {/* Budget and Message Preview */}
                    <div className="mt-2 text-sm text-slate-500">
                      {inquiry.budgetMin && inquiry.budgetMax && (
                        <p>
                          <strong>Budget:</strong> ₹{inquiry.budgetMin} - ₹{inquiry.budgetMax}
                        </p>
                      )}
                      {inquiry.message && (
                        <p className="line-clamp-1">
                          <strong>Message:</strong> {inquiry.message}
                        </p>
                      )}
                    </div>

                    {/* Assignment */}
                    {inquiry.assignee && (
                      <div className="mt-2 text-xs text-slate-500">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5">
                          Assigned to {inquiry.assignee.profile.fullName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Listing Info */}
                  <div className="ml-4 text-right">
                    <p className="text-sm text-slate-600">
                      <strong>₹{inquiry.listing.price}</strong>
                    </p>
                    <p className="text-xs text-slate-500">{inquiry.listing.city}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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
