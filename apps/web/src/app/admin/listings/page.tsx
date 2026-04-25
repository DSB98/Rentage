'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export default function AdminListingsPage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const fetchListings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (statusTab) params.set('status', statusTab);
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);

      const { data } = await api.get(`/admin/listings?${params}`);
      setListings(data.listings);
      setMeta(data.meta);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusTab, search, categoryFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const approve = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/listings/${id}/approve`);
      fetchListings(meta.page);
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.id);
    try {
      await api.patch(`/admin/listings/${rejectModal.id}/reject`, { reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchListings(meta.page);
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const toggleFeatured = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/listings/${id}/feature`);
      fetchListings(meta.page);
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Listing Moderation</h1>
        <p className="mt-1 text-sm text-slate-500">{meta.total} listings found</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              statusTab === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20">
          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="mt-3 text-sm text-slate-500">No listings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
              {/* Image */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {listing.images?.[0]?.url ? (
                  <img src={listing.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No img</div>
                )}
                {listing.isFeatured && (
                  <div className="absolute left-1 top-1 rounded bg-amber-500 px-1 py-0.5 text-[10px] font-bold text-white">FEATURED</div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{listing.title}</h3>
                    <p className="text-xs text-slate-500">
                      {listing.category?.name} · {listing.city}, {listing.state} · ₹{Number(listing.price).toLocaleString()}/{listing.rentPeriod}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      by {listing.owner?.profile?.fullName || listing.owner?.email} · {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                    {listing.rejectionReason && (
                      <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
                        Reason: {listing.rejectionReason}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={listing.status} />
                </div>

                {/* Stats */}
                <div className="mt-2 flex gap-4 text-xs text-slate-400">
                  <span>{listing._count?.conversations || 0} conversations</span>
                  <span>{listing._count?.savedBy || 0} saves</span>
                  {listing._count?.reports > 0 && (
                    <span className="text-red-500">{listing._count.reports} reports</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/listings/${listing.id}`}
                  target="_blank"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="View listing"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
                <button
                  onClick={() => toggleFeatured(listing.id)}
                  disabled={actionLoading === listing.id}
                  className={`rounded-lg p-2 transition ${
                    listing.isFeatured
                      ? 'text-amber-500 hover:bg-amber-50'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500'
                  }`}
                  title={listing.isFeatured ? 'Unfeature' : 'Feature'}
                >
                  <svg className="h-4 w-4" fill={listing.isFeatured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                {(listing.status === 'PENDING_APPROVAL' || listing.status === 'REJECTED') && (
                  <button
                    onClick={() => approve(listing.id)}
                    disabled={actionLoading === listing.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading === listing.id ? '...' : 'Approve'}
                  </button>
                )}
                {listing.status !== 'REJECTED' && (
                  <button
                    onClick={() => setRejectModal({ id: listing.id, title: listing.title })}
                    disabled={actionLoading === listing.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchListings(meta.page - 1)}
              disabled={meta.page <= 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => fetchListings(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Reject Listing</h3>
            <p className="mt-1 text-sm text-slate-500">Provide a reason for rejecting &quot;{rejectModal.title}&quot;</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={!rejectReason.trim() || actionLoading === rejectModal.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === rejectModal.id ? 'Rejecting...' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-700',
    INACTIVE: 'bg-slate-100 text-slate-600',
    DRAFT: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.DRAFT}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
