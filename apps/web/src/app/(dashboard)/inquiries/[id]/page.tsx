'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

type InquiryDetail = {
  id: string;
  status: string;
  source?: string | null;
  message?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  closedReason?: string | null;
  listing: {
    id: string;
    title: string;
    city?: string;
    state?: string;
    price?: number;
    rentPeriod?: string;
  };
  owner?: { id: string; email?: string; profile?: { fullName?: string; phone?: string | null; avatarUrl?: string | null } };
  renter?: { id: string; email?: string; profile?: { fullName?: string; phone?: string | null; avatarUrl?: string | null } };
  conversation?: { id: string; lastMessageAt?: string | null } | null;
};

type InquiryActivity = {
  id: string;
  type: string;
  note?: string | null;
  data?: any;
  createdAt: string;
  actor?: { id: string; profile?: { fullName?: string; avatarUrl?: string | null } };
};

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [activities, setActivities] = useState<InquiryActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [convertOpen, setConvertOpen] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [convertForm, setConvertForm] = useState({
    startDate: '',
    endDate: '',
    unitPrice: '',
    totalAmount: '',
    depositAmount: '0',
    receivedAmount: '0',
    paymentMethod: '',
    requiredDocuments: '',
    verificationNotes: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const inquiryId = params.id;
    if (!inquiryId) return;

    setLoading(true);
    setError('');

    Promise.all([
      api.get(`/inquiries/${inquiryId}`),
      api.get(`/inquiries/${inquiryId}/activities?limit=20`),
    ])
      .then(([detailRes, activityRes]) => {
        const detail = (detailRes.data || null) as InquiryDetail;
        const activityData = activityRes.data || {};
        setInquiry(detail);
        setActivities((activityData.items || []) as InquiryActivity[]);
        setHasMore(Boolean(activityData.meta?.hasMore));
        setNextCursor((activityData.meta?.nextCursor || null) as string | null);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || 'Failed to load inquiry details');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, params.id, router]);

  const mergedTimeline = useMemo(() => {
    if (!inquiry) return [] as InquiryActivity[];

    const syntheticRows: InquiryActivity[] = [
      {
        id: `${inquiry.id}-created`,
        type: 'CREATED',
        note: inquiry.message || 'Inquiry created',
        createdAt: inquiry.createdAt,
      },
    ];

    if (inquiry.closedAt) {
      syntheticRows.push({
        id: `${inquiry.id}-closed`,
        type: 'CLOSED',
        note: inquiry.closedReason || undefined,
        createdAt: inquiry.closedAt,
      });
    }

    const seen = new Set<string>();
    const rows = [...activities, ...syntheticRows].filter((row) => {
      const key = `${row.type}-${row.createdAt}-${row.note || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return rows.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [activities, inquiry]);

  const cancelInquiry = async () => {
    if (!inquiry) return;
    const note = (globalThis as any)?.prompt?.('Reason for cancelling this inquiry (optional):', 'No longer interested') || '';
    const confirmed = Boolean((globalThis as any)?.confirm?.('Cancel this inquiry?'));
    if (!confirmed) return;

    setUpdating(true);
    setError('');
    try {
      await api.patch(`/inquiries/${inquiry.id}/status`, {
        status: 'LOST',
        note: note?.trim() || undefined,
      });

      const [detailRes, activityRes] = await Promise.all([
        api.get(`/inquiries/${inquiry.id}`),
        api.get(`/inquiries/${inquiry.id}/activities?limit=20`),
      ]);

      const detail = (detailRes.data || null) as InquiryDetail;
      const activityData = activityRes.data || {};
      setInquiry(detail);
      setActivities((activityData.items || []) as InquiryActivity[]);
      setHasMore(Boolean(activityData.meta?.hasMore));
      setNextCursor((activityData.meta?.nextCursor || null) as string | null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel inquiry');
    } finally {
      setUpdating(false);
    }
  };

  const convertToBooking = async () => {
    if (!inquiry) return;

    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.post(`/inquiries/${inquiry.id}/convert-to-booking`, {
        startDate: new Date(convertForm.startDate).toISOString(),
        endDate: new Date(convertForm.endDate).toISOString(),
        unitPrice: Number(convertForm.unitPrice || 0),
        totalAmount: Number(convertForm.totalAmount || 0),
        depositAmount: Number(convertForm.depositAmount || 0),
        receivedAmount: Number(convertForm.receivedAmount || 0),
        paymentMethod: convertForm.paymentMethod || undefined,
        requiredDocuments: convertForm.requiredDocuments
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        verificationNotes: convertForm.verificationNotes || undefined,
      });
      
      // Refresh inquiry detail
      const [detailRes, activityRes] = await Promise.all([
        api.get(`/inquiries/${inquiry.id}`),
        api.get(`/inquiries/${inquiry.id}/activities?limit=20`),
      ]);

      const detail = (detailRes.data || null) as InquiryDetail;
      const activityData = activityRes.data || {};
      setInquiry(detail);
      setActivities((activityData.items || []) as InquiryActivity[]);
      setConvertOpen(false);
      
      // Show success message and navigate
      setSuccess(`Booking created! Redirecting...`);
      setTimeout(() => {
        router.push(`/bookings/${result.data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to convert inquiry to booking');
    } finally {
      setUpdating(false);
    }
  };

  const loadMoreActivities = async () => {
    if (!inquiry || !hasMore || !nextCursor || loadingActivities) return;

    setLoadingActivities(true);
    try {
      const { data } = await api.get(
        `/inquiries/${inquiry.id}/activities?limit=20&cursor=${encodeURIComponent(nextCursor)}`,
      );
      const result = data || {};
      const nextRows = (result.items || []) as InquiryActivity[];
      setActivities((prev) => [...prev, ...nextRows]);
      setHasMore(Boolean(result.meta?.hasMore));
      setNextCursor((result.meta?.nextCursor || null) as string | null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load more activities');
    } finally {
      setLoadingActivities(false);
    }
  };

  // Prefill convert form when inquiry loads — must be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (!inquiry) return;

    const start = inquiry.preferredAt ? toDateTimeLocalValue(inquiry.preferredAt) : '';
    const end = inquiry.preferredAt
      ? toDateTimeLocalValue(addDurationByRentPeriod(inquiry.preferredAt, inquiry.listing.rentPeriod))
      : '';
    const basePrice = String(inquiry.budgetMax || inquiry.budgetMin || inquiry.listing.price || 0);

    setConvertForm((prev) => ({
      ...prev,
      startDate: prev.startDate || start,
      endDate: prev.endDate || end,
      unitPrice: prev.unitPrice || basePrice,
      totalAmount: prev.totalAmount || basePrice,
    }));
  }, [inquiry]);

  const canCancel = !['LOST', 'CLOSED', 'CONVERTED'].includes(inquiry?.status ?? '');
  const canConvert =
    inquiry !== null &&
    !['CONVERTED', 'CLOSED', 'LOST'].includes(inquiry.status) &&
    (user?.id === inquiry.owner?.id || ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'AGENCY_ADMIN'].includes(user?.role || ''));
  const totalPayable = Number(convertForm.totalAmount || 0) + Number(convertForm.depositAmount || 0);
  const dueAmount = Math.max(0, totalPayable - Number(convertForm.receivedAmount || 0));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Inquiry not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiry Details</h1>
          <p className="mt-1 text-sm text-slate-500">Created on {formatDateTime(inquiry.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(inquiry.status)}`}>
          {prettyStatus(inquiry.status)}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Listing</h2>
        <Link href={`/listings/${inquiry.listing.id}`} className="mt-1 block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          {inquiry.listing.title}
        </Link>
        <p className="mt-1 text-sm text-slate-500">
          {inquiry.listing.city}, {inquiry.listing.state}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoRow label="Price" value={`₹${Number(inquiry.listing.price || 0).toLocaleString('en-IN')} / ${String(inquiry.listing.rentPeriod || '').toLowerCase()}`} />
          <InfoRow label="Source" value={inquiry.source || 'listing_page'} />
          <InfoRow label="Budget" value={formatBudget(inquiry.budgetMin, inquiry.budgetMax)} />
          <InfoRow label="Preferred At" value={inquiry.preferredAt ? formatDateTime(inquiry.preferredAt) : 'Not set'} />
        </div>

        {inquiry.message && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Your message</p>
            <p className="mt-1 whitespace-pre-wrap">{inquiry.message}</p>
          </div>
        )}
      </div>

      {/* Contact Information */}
      {(inquiry.renter || inquiry.owner) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {inquiry.renter && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Renter</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{inquiry.renter.profile?.fullName}</p>
                <p className="text-xs text-slate-500">{inquiry.renter.email}</p>
                {inquiry.renter.profile?.phone && (
                  <p className="mt-1 text-xs text-slate-500">{inquiry.renter.profile.phone}</p>
                )}
              </div>
            )}
            {inquiry.owner && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{inquiry.owner.profile?.fullName}</p>
                <p className="text-xs text-slate-500">{inquiry.owner.email}</p>
                {inquiry.owner.profile?.phone && (
                  <p className="mt-1 text-xs text-slate-500">{inquiry.owner.profile.phone}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/listings/${inquiry.listing.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            View listing
          </Link>
          {inquiry.conversation?.id ? (
            <Link href={`/chat/${inquiry.conversation.id}`} className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
              Open chat
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400">
              Chat will appear once the conversation is ready
            </span>
          )}
          {canConvert && (
            <button
              onClick={() => setConvertOpen(true)}
              disabled={updating}
              className="rounded-lg border border-green-200 px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 disabled:opacity-60"
            >
              {updating ? 'Converting...' : 'Convert to booking'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={cancelInquiry}
              disabled={updating}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {updating ? 'Cancelling...' : 'Cancel inquiry'}
            </button>
          )}
          <Link href="/inquiries" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Back to history
          </Link>
        </div>
      </div>

      {convertOpen && canConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConvertOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Review Before Booking Confirmation</h2>
                <p className="mt-1 text-sm text-slate-500">Verify the booking window, renter details, payment summary, due amount, and required documents before converting this inquiry.</p>
              </div>
              <button onClick={() => setConvertOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Renter Details</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Name:</span> {inquiry.renter?.profile?.fullName || 'Unknown renter'}</p>
                  <p><span className="font-medium text-slate-900">Email:</span> {inquiry.renter?.email || 'Not available'}</p>
                  <p><span className="font-medium text-slate-900">Phone:</span> {inquiry.renter?.profile?.phone || 'Not available'}</p>
                  <p><span className="font-medium text-slate-900">Inquiry message:</span> {inquiry.message || 'Not provided'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Booking Window</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Start date/time">
                    <input type="datetime-local" value={convertForm.startDate} onChange={(e) => setConvertForm((prev) => ({ ...prev, startDate: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                  <Field label="End date/time">
                    <input type="datetime-local" value={convertForm.endDate} onChange={(e) => setConvertForm((prev) => ({ ...prev, endDate: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-900">Payment Verification</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Unit price">
                    <input type="number" min="0" value={convertForm.unitPrice} onChange={(e) => setConvertForm((prev) => ({ ...prev, unitPrice: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                  <Field label="Total amount">
                    <input type="number" min="0" value={convertForm.totalAmount} onChange={(e) => setConvertForm((prev) => ({ ...prev, totalAmount: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                  <Field label="Deposit amount">
                    <input type="number" min="0" value={convertForm.depositAmount} onChange={(e) => setConvertForm((prev) => ({ ...prev, depositAmount: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                  <Field label="Received amount">
                    <input type="number" min="0" value={convertForm.receivedAmount} onChange={(e) => setConvertForm((prev) => ({ ...prev, receivedAmount: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Payment method">
                    <input type="text" value={convertForm.paymentMethod} onChange={(e) => setConvertForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} placeholder="UPI / Cash / Bank transfer / Pending" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Due amount</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">₹{dueAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-900">Documents & Notes</h3>
                <div className="mt-3 grid gap-3">
                  <Field label="Required documents">
                    <input type="text" value={convertForm.requiredDocuments} onChange={(e) => setConvertForm((prev) => ({ ...prev, requiredDocuments: e.target.value }))} placeholder="ID proof, agreement, address proof" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                  <Field label="Verification notes">
                    <textarea value={convertForm.verificationNotes} onChange={(e) => setConvertForm((prev) => ({ ...prev, verificationNotes: e.target.value }))} rows={5} placeholder="Record the verification checks, pending payments, document status, and any terms agreed before conversion." className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </Field>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setConvertOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button
                onClick={convertToBooking}
                disabled={updating || !convertForm.startDate || !convertForm.endDate || !convertForm.totalAmount}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {updating ? 'Creating booking...' : 'Confirm booking conversion'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Status Timeline</h2>

        <div className="mt-4 space-y-3">
          {mergedTimeline.map((event) => (
            <div key={event.id} className="rounded-lg border border-slate-200 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{prettyActivity(event.type)}</p>
                <p className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
              </div>
              {event.note && <p className="mt-1 text-sm text-slate-600">{event.note}</p>}
              {event.actor?.profile?.fullName && (
                <p className="mt-1 text-xs text-slate-400">By {event.actor.profile.fullName}</p>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-4 text-center">
            <button
              onClick={loadMoreActivities}
              disabled={loadingActivities}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingActivities ? 'Loading...' : 'Load More Timeline'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
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

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function prettyActivity(type: string) {
  return type.replace(/_/g, ' ');
}

function formatBudget(min?: number | null, max?: number | null) {
  if (min && max) return `₹${Number(min).toLocaleString('en-IN')} - ₹${Number(max).toLocaleString('en-IN')}`;
  if (min) return `From ₹${Number(min).toLocaleString('en-IN')}`;
  if (max) return `Up to ₹${Number(max).toLocaleString('en-IN')}`;
  return 'Not specified';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addDurationByRentPeriod(value: string, rentPeriod?: string) {
  const date = new Date(value);

  switch (rentPeriod) {
    case 'HOURLY':
      date.setHours(date.getHours() + 1);
      break;
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      break;
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'MONTHLY':
    default:
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date.toISOString();
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
