'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

type BookingDetail = {
  id: string;
  code: string;
  status: string;
  confirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  startDate: string;
  endDate: string;
  rentPeriod: string;
  unitPrice: number;
  totalAmount: number;
  depositAmount?: number | null;
  notes?: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city?: string;
    state?: string;
    price?: number;
  };
  renter?: { id: string; email?: string; profile?: { fullName?: string } };
  owner?: { id: string; email?: string; profile?: { fullName?: string } };
};

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOwner = user?.id && booking?.owner?.id === user.id;
  const isRenter = user?.id && booking?.renter?.id === user.id;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    api
      .get(`/bookings/${params.id}`)
      .then(({ data }) => setBooking((data || null) as BookingDetail))
      .catch((err: any) => {
        setError(err?.response?.data?.message || 'Failed to load booking');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, params.id, router]);

  const allowedActions = useMemo(() => {
    if (!booking) return [] as { label: string; status: string; reason?: string }[];

    const actions: { label: string; status: string; reason?: string }[] = [];

    if (booking.status === 'PENDING' && (isOwner || isAdmin)) {
      actions.push({ label: 'Confirm Booking', status: 'CONFIRMED' });
    }

    if (booking.status === 'CONFIRMED' && (isOwner || isAdmin)) {
      actions.push({ label: 'Mark Active', status: 'ACTIVE' });
    }

    if (booking.status === 'ACTIVE' && (isOwner || isAdmin)) {
      actions.push({ label: 'Mark Completed', status: 'COMPLETED' });
    }

    if (booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (isOwner || isRenter || isAdmin)) {
      actions.push({ label: 'Cancel Booking', status: 'CANCELLED', reason: 'Cancelled from web dashboard' });
    }

    return actions;
  }, [booking, isAdmin, isOwner, isRenter]);

  const updateStatus = async (nextStatus: string, reason?: string) => {
    if (!booking) return;

    let cancellationReason = reason;
    if (nextStatus === 'CANCELLED') {
      const asked = (globalThis as any)?.prompt?.('Please provide a cancellation reason (optional):', reason || '');
      if (typeof asked === 'string') {
        cancellationReason = asked.trim() || undefined;
      }
      const confirmed = Boolean((globalThis as any)?.confirm?.('Are you sure you want to cancel this booking?'));
      if (!confirmed) {
        return;
      }
    }

    setUpdating(true);
    setError('');
    try {
      const payload: any = { status: nextStatus };
      if (cancellationReason) payload.reason = cancellationReason;
      await api.patch(`/bookings/${booking.id}/status`, payload);
      const refreshed = await api.get(`/bookings/${booking.id}`);
      setBooking((refreshed.data || null) as BookingDetail);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Booking not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booking {booking.code}</h1>
          <p className="mt-1 text-sm text-slate-500">Created on {new Date(booking.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Listing</h2>
        <Link href={`/listings/${booking.listing.id}`} className="mt-1 block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          {booking.listing.title}
        </Link>
        <p className="mt-1 text-sm text-slate-500">
          {booking.listing.city}, {booking.listing.state}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoRow label="Start" value={new Date(booking.startDate).toLocaleString('en-IN')} />
          <InfoRow label="End" value={new Date(booking.endDate).toLocaleString('en-IN')} />
          <InfoRow label="Rent Period" value={booking.rentPeriod} />
          <InfoRow label="Unit Price" value={`₹${Number(booking.unitPrice).toLocaleString('en-IN')}`} />
          <InfoRow label="Total Amount" value={`₹${Number(booking.totalAmount).toLocaleString('en-IN')}`} />
          <InfoRow
            label="Deposit"
            value={
              booking.depositAmount
                ? `₹${Number(booking.depositAmount).toLocaleString('en-IN')}`
                : 'Not specified'
            }
          />
        </div>

        {booking.notes && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Renter note</p>
            <p className="mt-1 whitespace-pre-wrap">{booking.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Participants</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoRow label="Renter" value={booking.renter?.profile?.fullName || booking.renter?.email || 'Unknown'} />
          <InfoRow label="Owner" value={booking.owner?.profile?.fullName || booking.owner?.email || 'Unknown'} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
        {allowedActions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No status actions available for this booking.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {allowedActions.map((action) => (
              <button
                key={action.label}
                onClick={() => updateStatus(action.status, action.reason)}
                disabled={updating}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                  action.status === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {updating ? 'Updating...' : action.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Link href="/bookings" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Back to bookings
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
        <div className="mt-4 space-y-3">
          {timelineRows(booking).map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                {row.note && <p className="mt-0.5 text-xs text-slate-500">{row.note}</p>}
              </div>
              <p className="text-xs font-medium text-slate-600">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
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

function timelineRows(booking: BookingDetail) {
  const rows: { label: string; value: string; note?: string }[] = [];

  rows.push({
    label: 'Booking created',
    value: new Date(booking.createdAt).toLocaleString('en-IN'),
  });

  if (booking.confirmedAt) {
    rows.push({
      label: 'Booking confirmed',
      value: new Date(booking.confirmedAt).toLocaleString('en-IN'),
    });
  }

  if (booking.status === 'ACTIVE') {
    rows.push({
      label: 'Booking active',
      value: 'Currently active',
      note: `${new Date(booking.startDate).toLocaleString('en-IN')} to ${new Date(booking.endDate).toLocaleString('en-IN')}`,
    });
  }

  if (booking.completedAt) {
    rows.push({
      label: 'Booking completed',
      value: new Date(booking.completedAt).toLocaleString('en-IN'),
    });
  }

  if (booking.cancelledAt) {
    rows.push({
      label: 'Booking cancelled',
      value: new Date(booking.cancelledAt).toLocaleString('en-IN'),
      note: booking.cancelledReason || 'No cancellation reason provided',
    });
  }

  return rows;
}
