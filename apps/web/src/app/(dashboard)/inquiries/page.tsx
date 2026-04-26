'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_FILTERS = [
  'ALL',
  'NEW',
  'CONTACTED',
  'NEGOTIATING',
  'VISIT_SCHEDULED',
  'CONVERTED',
  'LOST',
  'CLOSED',
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type InquiryRow = {
  id: string;
  status: string;
  source?: string | null;
  message?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredAt?: string | null;
  createdAt: string;
  listing: { id: string; title: string; city?: string; price?: number };
  owner?: { id: string; profile?: { fullName?: string; phone?: string | null } };
  renter?: { id: string; profile?: { fullName?: string; phone?: string | null } };
  conversation?: { id: string } | null;
};

type InquiryScope = 'renter' | 'owner';

export default function InquiriesPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [scope, setScope] = useState<InquiryScope>('renter');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    if (!isOwner && scope !== 'renter') {
      setScope('renter');
    }
  }, [isOwner, scope]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('scope', scope);
    params.set('limit', '12');
    if (statusFilter !== 'ALL') {
      params.set('status', statusFilter);
    }
    return params.toString();
  }, [scope, statusFilter]);

  useEffect(() => {
    setLoading(true);
    setError('');
    setNextCursor(null);
    setHasMore(false);

    api
      .get(`/inquiries/mine?${queryString}`)
      .then(({ data }) => {
        const result = data || {};
        const nextItems = (result.items || []) as InquiryRow[];
        setItems(nextItems);
        setHasMore(Boolean(result.meta?.hasMore));
        setNextCursor((result.meta?.nextCursor || null) as string | null);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || 'Failed to load inquiries');
      })
      .finally(() => setLoading(false));
  }, [queryString]);

  const loadMore = async () => {
    if (!hasMore || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    setError('');

    try {
      const params = new URLSearchParams(queryString);
      params.set('cursor', nextCursor);

      const { data } = await api.get(`/inquiries/mine?${params.toString()}`);
      const result = data || {};
      const nextItems = (result.items || []) as InquiryRow[];
      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(Boolean(result.meta?.hasMore));
      setNextCursor((result.meta?.nextCursor || null) as string | null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load more inquiries');
    } finally {
      setLoadingMore(false);
    }
  };

  const cancelInquiry = async (inquiryId: string) => {
    const note = (globalThis as any)?.prompt?.('Reason for cancelling this inquiry (optional):', 'No longer interested') || '';
    const confirmed = Boolean((globalThis as any)?.confirm?.('Cancel this inquiry?'));
    if (!confirmed) return;

    setUpdatingId(inquiryId);
    setError('');

    try {
      await api.patch(`/inquiries/${inquiryId}/status`, {
        status: 'LOST',
        note: note?.trim() || undefined,
      });
      setItems((prev) =>
        prev.map((row) => (row.id === inquiryId ? { ...row, status: 'LOST' } : row)),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel inquiry');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiries</h1>
          <p className="mt-1 text-sm text-slate-500">
            {scope === 'owner'
              ? 'Review inquiries received on your listings and continue the conversation.'
              : 'Track inquiries you have sent, view updates, or continue the conversation.'}
          </p>
        </div>
        <Link href="/listings" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          New Inquiry
        </Link>
      </div>

      {isOwner && (
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setScope('renter')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              scope === 'renter' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setScope('owner')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              scope === 'owner' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Received
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => {
          const active = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' ? 'All' : prettyStatus(status)}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">
            {scope === 'owner' ? 'No received inquiries found for this filter.' : 'No sent inquiries found for this filter.'}
          </p>
          <Link href="/listings" className="mt-4 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((inq) => {
            const canCancel = !['CLOSED', 'LOST', 'CONVERTED'].includes(inq.status);
            return (
              <div key={inq.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/inquiries/${inq.id}`} className="line-clamp-1 text-sm font-semibold text-slate-800 hover:text-indigo-700">
                      {inq.listing?.title || 'Listing'}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {inq.listing?.city || 'Unknown city'} • {formatCreated(inq.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {scope === 'owner'
                        ? `From ${inq.renter?.profile?.fullName || 'Unknown renter'}`
                        : `To ${inq.owner?.profile?.fullName || 'Unknown owner'}`}
                    </p>
                    {inq.message && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{inq.message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(inq.status)}`}>
                      {prettyStatus(inq.status)}
                    </span>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      {inq.conversation?.id && (
                        <Link href={`/chat/${inq.conversation.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                          Open chat
                        </Link>
                      )}
                      <Link href={`/inquiries/${inq.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        View timeline
                      </Link>
                      {scope === 'renter' && canCancel && (
                        <button
                          onClick={() => cancelInquiry(inq.id)}
                          disabled={updatingId === inq.id}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {updatingId === inq.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function formatCreated(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status: string) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-700';
    case 'CONTACTED':
      return 'bg-indigo-100 text-indigo-700';
    case 'NEGOTIATING':
      return 'bg-violet-100 text-violet-700';
    case 'VISIT_SCHEDULED':
      return 'bg-amber-100 text-amber-700';
    case 'CONVERTED':
      return 'bg-emerald-100 text-emerald-700';
    case 'LOST':
      return 'bg-red-100 text-red-700';
    case 'CLOSED':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
