'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const DATE_FILTERS = ['ALL', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM'] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

type BookingRow = {
  id: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  rentPeriod: string;
  listing: {
    id: string;
    title: string;
    city?: string;
    price?: number;
  };
  renter?: { profile?: { fullName?: string } };
  owner?: { profile?: { fullName?: string } };
};

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const isOwner = user?.role === 'OWNER' || user?.role === 'AGENT' || user?.role === 'AGENCY_ADMIN';

  const endpoint = useMemo(() => (isOwner ? '/bookings/owner' : '/bookings/mine'), [isOwner]);

  const buildDateQuery = () => {
    if (dateFilter === 'THIS_MONTH') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        createdFrom: toInputDate(start),
        createdTo: toInputDate(end),
      };
    }

    if (dateFilter === 'LAST_MONTH') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        createdFrom: toInputDate(start),
        createdTo: toInputDate(end),
      };
    }

    if (dateFilter === 'CUSTOM') {
      return {
        createdFrom: customFrom || undefined,
        createdTo: customTo || undefined,
      };
    }

    return {
      createdFrom: undefined,
      createdTo: undefined,
    };
  };

  useEffect(() => {
    if (dateFilter === 'CUSTOM' && customFrom && customTo && customFrom > customTo) {
      setItems([]);
      setHasMore(false);
      setNextCursor(null);
      setLoading(false);
      setError('From date must be before or equal to To date.');
      return;
    }

    setLoading(true);
    setError('');
    setNextCursor(null);
    setHasMore(false);

    const query = new URLSearchParams();
    query.set('limit', '20');
    if (statusFilter !== 'ALL') {
      query.set('status', statusFilter);
    }
    const { createdFrom, createdTo } = buildDateQuery();
    if (createdFrom) query.set('createdFrom', createdFrom);
    if (createdTo) query.set('createdTo', createdTo);

    api
      .get(`${endpoint}?${query.toString()}`)
      .then(({ data }) => {
        setItems((data?.items || []) as BookingRow[]);
        setHasMore(Boolean(data?.meta?.hasMore));
        setNextCursor((data?.meta?.nextCursor || null) as string | null);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || 'Failed to load bookings');
      })
      .finally(() => setLoading(false));
  }, [endpoint, statusFilter, dateFilter, customFrom, customTo]);

  const loadMore = async () => {
    if (!hasMore || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    setError('');
    try {
      const query = new URLSearchParams();
      query.set('limit', '20');
      query.set('cursor', nextCursor);
      if (statusFilter !== 'ALL') {
        query.set('status', statusFilter);
      }
      const { createdFrom, createdTo } = buildDateQuery();
      if (createdFrom) query.set('createdFrom', createdFrom);
      if (createdTo) query.set('createdTo', createdTo);

      const { data } = await api.get(`${endpoint}?${query.toString()}`);
      const nextItems = (data?.items || []) as BookingRow[];
      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(Boolean(data?.meta?.hasMore));
      setNextCursor((data?.meta?.nextCursor || null) as string | null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load more bookings');
    } finally {
      setLoadingMore(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isOwner ? 'Manage requests from renters' : 'Track your renting bookings'}
          </p>
        </div>
        {!isOwner && (
          <Link href="/listings" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            New Booking
          </Link>
        )}
      </div>

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
              {status}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value as DateFilter)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              <option value="ALL">All Dates</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e: any) => setCustomFrom(e.target.value)}
              disabled={dateFilter !== 'CUSTOM'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e: any) => setCustomTo(e.target.value)}
              disabled={dateFilter !== 'CUSTOM'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">
            {statusFilter === 'ALL' ? 'No bookings yet.' : `No ${statusFilter.toLowerCase()} bookings found.`}
          </p>
          {!isOwner && (
            <Link href="/listings" className="mt-4 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Browse listings
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/bookings/${b.id}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-700">
                    {b.code}
                  </Link>
                  <Link href={`/listings/${b.listing.id}`} className="mt-0.5 block text-sm text-indigo-600 hover:text-indigo-700">
                    {b.listing.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(b.startDate).toLocaleDateString('en-IN')} to {new Date(b.endDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(b.status)}`}>
                    {b.status}
                  </span>
                  <p className="mt-2 text-sm font-bold text-slate-900">₹{Number(b.totalAmount).toLocaleString('en-IN')}</p>
                  <Link href={`/bookings/${b.id}`} className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

function statusClass(status: string) {
  switch (status) {
    case 'CONFIRMED':
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function toInputDate(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}
