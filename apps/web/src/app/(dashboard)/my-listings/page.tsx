'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface MyListing {
  id: string;
  title: string;
  price: number;
  rentPeriod: string;
  city: string;
  state: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  rejectionReason?: string;
  images: { url: string }[];
  category: { name: string; slug: string };
  _count: { conversations: number; savedBy: number };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  PAUSED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Paused' },
  RENTED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Rented' },
};

export default function MyListingsPage() {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null);

  useEffect(() => {
    fetchListings();
  }, [filter]);

  useEffect(() => {
    api
      .get('/subscriptions/usage')
      .then(({ data }) => {
        const listingUsage = data?.usage?.listings;
        if (listingUsage) {
          setUsage({
            used: listingUsage.used || 0,
            limit: listingUsage.limit ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/listings/owner/my-listings${params}`);
      setListings(data.data || data || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(globalThis as any)?.confirm?.('Are you sure you want to delete this listing?')) return;
    setDeleting(id);
    try {
      await api.delete(`/listings/${id}`);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch {
      (globalThis as any)?.alert?.('Failed to delete listing');
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePause = async (listing: MyListing) => {
    const newStatus = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/listings/${listing.id}`, { status: newStatus });
      await fetchListings();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to update listing';
      if (typeof message === 'string' && message.toLowerCase().includes('active listing limit reached')) {
        (globalThis as any)?.alert?.(`${message} To activate this listing, pause one currently active listing or upgrade your plan.`);
      } else {
        (globalThis as any)?.alert?.(message);
      }
    }
  };

  const handleResubmit = async (listingId: string) => {
    try {
      await api.post(`/listings/${listingId}/resubmit`);
      await fetchListings();
    } catch (err: any) {
      (globalThis as any)?.alert?.(err?.response?.data?.message || 'Failed to resubmit listing');
    }
  };

  const counts = {
    all: listings.length,
    active: listings.filter((l) => l.status === 'ACTIVE').length,
    pending: listings.filter((l) => l.status === 'PENDING_APPROVAL').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="mt-1 text-sm text-gray-500">{listings.length} total listings</p>
          {usage && (
            <p className="mt-1 text-xs text-indigo-700">
              Plan usage: {usage.used}/{usage.limit && usage.limit > 0 ? usage.limit : '∞'} listings used
            </p>
          )}
        </div>
        <Link
          href="/create-listing"
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          + New Listing
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto border-b">
        {[
          { value: '', label: `All (${counts.all})` },
          { value: 'ACTIVE', label: `Active (${counts.active})` },
          { value: 'PENDING_APPROVAL', label: `Pending (${counts.pending})` },
          { value: 'PAUSED', label: 'Paused' },
          { value: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
              filter === tab.value
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings */}
      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <p className="mt-3 text-gray-500">No listings yet</p>
          <Link
            href="/create-listing"
            className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {listings.map((listing) => {
            const statusStyle = STATUS_STYLES[listing.status] || STATUS_STYLES.PAUSED;
            return (
              <div
                key={listing.id}
                className="flex gap-4 rounded-xl border bg-white p-4 transition hover:shadow-sm"
              >
                {/* Image */}
                <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/listings/${listing.id}`} className="font-semibold text-gray-900 hover:text-primary-600">
                          {listing.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                          <span className="text-xs text-gray-400">{listing.category?.name}</span>
                        </div>
                      </div>
                      <p className="text-right">
                        <span className="text-lg font-bold text-gray-900">₹{listing.price.toLocaleString('en-IN')}</span>
                        <span className="text-sm text-gray-500">/{listing.rentPeriod.toLowerCase()}</span>
                      </p>
                    </div>

                    {listing.status === 'REJECTED' && listing.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">Reason: {listing.rejectionReason}</p>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{listing.city}, {listing.state}</span>
                      <span>{listing._count.savedBy} saves</span>
                      <span>{listing._count.conversations} inquiries</span>
                      <span>{new Date(listing.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {listing.status === 'ACTIVE' || listing.status === 'PAUSED' ? (
                        <button
                          onClick={() => handleTogglePause(listing)}
                          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          {listing.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </button>
                      ) : null}
                      {listing.status === 'REJECTED' ? (
                        <button
                          onClick={() => handleResubmit(listing.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          Resubmit
                        </button>
                      ) : null}
                      <Link
                        href={`/edit-listing/${listing.id}`}
                        className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={deleting === listing.id}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === listing.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
