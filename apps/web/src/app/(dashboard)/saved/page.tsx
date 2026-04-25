'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ListingCard from '@/components/ListingCard';

interface SavedListing {
  id: string;
  title: string;
  price: number;
  rentPeriod: string;
  city: string;
  state: string;
  isFeatured: boolean;
  images: { url: string }[];
  category: { name: string; slug: string };
}

export default function SavedListingsPage() {
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/user/saved');
      setListings(data.data || data || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (listingId: string) => {
    try {
      await api.delete(`/listings/${listingId}/save`);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
      <p className="mt-1 text-sm text-gray-500">{listings.length} saved items</p>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-8 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">No saved listings</h3>
          <p className="mt-1 text-sm text-gray-500">Browse listings and save the ones you like</p>
          <Link
            href="/listings"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard
                id={listing.id}
                title={listing.title}
                price={listing.price}
                rentPeriod={listing.rentPeriod}
                city={listing.city}
                state={listing.state}
                imageUrl={listing.images?.[0]?.url}
                categoryName={listing.category?.name}
                isFeatured={listing.isFeatured}
              />
              <button
                onClick={() => handleUnsave(listing.id)}
                className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 shadow-sm transition hover:bg-red-50"
                title="Remove from saved"
              >
                <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
