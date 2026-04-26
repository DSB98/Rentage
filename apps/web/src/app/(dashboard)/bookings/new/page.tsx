'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

type ListingSummary = {
  id: string;
  title: string;
  price: number;
  rentPeriod: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  city?: string;
  state?: string;
  owner?: { profile?: { fullName?: string } };
};

type UsageSummary = {
  usage?: {
    bookingsThisMonth?: { used: number; limit: number | null };
  };
};

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId') || '';
  const { isAuthenticated } = useAuthStore();

  const [listing, setListing] = useState<ListingSummary | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!listingId) {
      setLoading(false);
      setError('Missing listing id. Please start booking from a listing page.');
      return;
    }

    Promise.all([api.get(`/listings/${listingId}`), api.get('/subscriptions/usage')])
      .then(([listingRes, usageRes]) => {
        setListing((listingRes.data || null) as ListingSummary);
        setUsage((usageRes.data || null) as UsageSummary);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || 'Unable to load booking information');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, listingId, router]);

  const bookingUsage = usage?.usage?.bookingsThisMonth;
  const isQuotaBlocked =
    Boolean(bookingUsage) &&
    Boolean(bookingUsage?.limit && bookingUsage.limit > 0) &&
    bookingUsage!.used >= (bookingUsage!.limit || 0);

  const estimatedTotal = useMemo(() => {
    if (!listing || !startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;

    const ms = end.getTime() - start.getTime();
    const hours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
    const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));

    let units = days;
    switch (listing.rentPeriod) {
      case 'HOURLY':
        units = hours;
        break;
      case 'DAILY':
        units = days;
        break;
      case 'WEEKLY':
        units = Math.max(1, Math.ceil(days / 7));
        break;
      case 'MONTHLY':
        units = Math.max(1, Math.ceil(days / 30));
        break;
      case 'YEARLY':
        units = Math.max(1, Math.ceil(days / 365));
        break;
      default:
        units = days;
    }

    return {
      units,
      total: Number((Number(listing.price) * units).toFixed(2)),
    };
  }, [listing, startDate, endDate]);

  const submitBooking = async () => {
    if (!listing) return;

    setError('');

    if (!startDate || !endDate) {
      setError('Start and end date are required');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/bookings', {
        listingId: listing.id,
        startDate,
        endDate,
        notes: notes.trim() || undefined,
      });
      router.push('/bookings');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create booking';
      if (typeof message === 'string' && message.toLowerCase().includes('monthly booking limit reached')) {
        setError(`${message} Upgrade your plan to continue renting.`);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book This Listing</h1>
        <p className="mt-1 text-sm text-slate-500">Choose rental dates and create your booking request.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isQuotaBlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Your booking quota is reached for this month.</p>
          <p className="mt-1 text-xs text-amber-800">
            Used {bookingUsage?.used}/{bookingUsage?.limit}. Upgrade plan to create more bookings.
          </p>
          <Link href="/subscription" className="mt-3 inline-block rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700">
            Upgrade Plan
          </Link>
        </div>
      )}

      {listing ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">{listing.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {listing.city}, {listing.state} • ₹{Number(listing.price).toLocaleString('en-IN')} / {listing.rentPeriod.toLowerCase()}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e: any) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e: any) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e: any) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Any special request or message to the owner"
            />
          </div>

          {estimatedTotal && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-600">Estimated units: {estimatedTotal.units}</p>
              <p className="font-semibold text-slate-900">Estimated total: ₹{estimatedTotal.total.toLocaleString('en-IN')}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={submitBooking}
              disabled={submitting || isQuotaBlocked}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Confirm Booking Request'}
            </button>
            <Link href={`/listings/${listing.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back to listing
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Listing not found.
        </div>
      )}
    </div>
  );
}
