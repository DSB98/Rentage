'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  rentPeriod: string;
  city: string;
  state: string;
  imageUrl?: string;
  images?: { url: string }[];
  categoryName?: string;
  categorySlug?: string;
  ownerName?: string;
  isFeatured?: boolean;
  createdAt?: string;
  amenities?: { key: string; value: string }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  homes: 'bg-blue-100 text-blue-700',
  flats: 'bg-violet-100 text-violet-700',
  pgs: 'bg-pink-100 text-pink-700',
  cars: 'bg-emerald-100 text-emerald-700',
  bikes: 'bg-orange-100 text-orange-700',
  'washing-machines': 'bg-cyan-100 text-cyan-700',
  'water-filters': 'bg-sky-100 text-sky-700',
  electronics: 'bg-indigo-100 text-indigo-700',
  furniture: 'bg-amber-100 text-amber-700',
  'tools-equipment': 'bg-slate-100 text-slate-700',
  others: 'bg-gray-100 text-gray-700',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const PERIOD_SHORT: Record<string, string> = {
  HOURLY: 'hr',
  DAILY: 'day',
  WEEKLY: 'wk',
  MONTHLY: 'mo',
  YEARLY: 'yr',
};

export default function ListingCard({
  id,
  title,
  price,
  rentPeriod,
  city,
  state,
  imageUrl,
  images,
  categoryName,
  categorySlug,
  ownerName,
  isFeatured,
  createdAt,
  amenities,
}: ListingCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const allImages = images?.map((i) => i.url) || (imageUrl ? [imageUrl] : []);
  const currentImg = allImages[imgIdx];
  const topAmenities = amenities?.slice(0, 3) || [];

  return (
    <Link
      href={`/listings/${id}`}
      className="group card-interactive flex flex-col overflow-hidden animate-fade-in"
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-100">
        {currentImg && !imgError ? (
          <img
            src={currentImg}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200">
            <svg className="h-14 w-14 text-surface-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay (bottom only) */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Image dots (if multiple) */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {allImages.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === imgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Top badges row */}
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          <div className="flex flex-wrap gap-1.5">
            {isFeatured && (
              <span className="badge-featured text-[10px]">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
                Featured
              </span>
            )}
            {categoryName && (
              <span className={`badge text-[10px] backdrop-blur-sm ${CATEGORY_COLORS[categorySlug || ''] || 'bg-white/90 text-gray-700'}`}>
                {categoryName}
              </span>
            )}
          </div>
          {allImages.length > 1 && (
            <span className="badge bg-black/40 text-[10px] text-white backdrop-blur-sm">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              {allImages.length}
            </span>
          )}
        </div>

        {/* Price pill on image */}
        <div className="absolute bottom-2.5 left-3 z-10">
          <span className="inline-flex items-baseline gap-0.5 rounded-lg bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
            <span className="text-sm font-bold text-slate-900">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-[10px] font-medium text-surface-400">/{PERIOD_SHORT[rentPeriod] || rentPeriod.toLowerCase()}</span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-[15px] font-semibold text-slate-900 transition-colors group-hover:text-primary-600">
          {title}
        </h3>

        {/* Location */}
        <div className="mt-1.5 flex items-center gap-1 text-surface-400">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="line-clamp-1 text-xs">{city}, {state}</span>
        </div>

        {/* Quick amenities */}
        {topAmenities.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {topAmenities.map((a, i) => (
              <span key={i} className="rounded-md bg-surface-50 px-2 py-0.5 text-[10px] font-medium text-surface-500">
                {a.key}: {a.value}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div className="mt-auto flex items-center justify-between pt-3">
          {ownerName && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] text-surface-400">{ownerName}</span>
            </div>
          )}
          {createdAt && (
            <span className="text-[10px] text-surface-300">{timeAgo(createdAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
