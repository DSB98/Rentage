'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';

interface Listing {
  id: string;
  title: string;
  price: number;
  rentPeriod: string;
  city: string;
  state: string;
  isFeatured: boolean;
  createdAt: string;
  images: { id: string; url: string; sortOrder: number }[];
  amenities: { id: string; key: string; value: string }[];
  category: { id: string; name: string; slug: string };
  owner: { id: string; profile: { fullName: string; city: string } };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const RENT_PERIODS = [
  { value: '', label: 'All' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [totalText, setTotalText] = useState('');

  // Filter state from URL params
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [rentPeriod, setRentPeriod] = useState(searchParams.get('rentPeriod') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setCategories(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const fetchListings = useCallback(async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (categoryId) params.set('categoryId', categoryId);
      if (city) params.set('city', city);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (rentPeriod) params.set('rentPeriod', rentPeriod);
      if (sort) params.set('sort', sort);
      if (append && cursor) params.set('cursor', cursor);
      params.set('limit', '18');

      const { data } = await api.get(`/listings/search?${params}`);
      const result = data.data || data;
      const items = result.items || result || [];

      if (append) {
        setListings((prev) => [...prev, ...items]);
      } else {
        setListings(items);
      }
      setHasMore(result.meta?.hasMore || false);
      setCursor(result.meta?.cursor);

      if (!append) {
        setTotalText(items.length > 0 ? `${items.length}${result.meta?.hasMore ? '+' : ''} results` : 'No results');
      }
    } catch {
      if (!append) setListings([]);
    } finally {
      setLoading(false);
    }
  }, [query, categoryId, city, minPrice, maxPrice, rentPeriod, sort, cursor]);

  useEffect(() => {
    fetchListings(false);
  }, [categoryId, city, minPrice, maxPrice, rentPeriod, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(false);
  };

  const clearFilters = () => {
    setQuery('');
    setCategoryId('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setRentPeriod('');
    setSort('newest');
  };

  const hasActiveFilters = categoryId || city || minPrice || maxPrice || rentPeriod || query;

  return (
    <div className="min-h-screen bg-surface-50">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for homes, cars, bikes, appliances..."
              className="input-lg w-full pl-12"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-3">Search</button>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="btn-secondary px-4 py-3 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
          </button>
        </form>

        <div className="mt-6 flex gap-6">
          {/* Filters sidebar */}
          <aside className={`w-64 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-20 space-y-5 card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    Clear all
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="select mt-1.5 w-full">
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Bangalore"
                  className="input mt-1.5 w-full"
                />
              </div>

              {/* Price range */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400">Price Range (₹)</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" min="0" className="input w-full" />
                  <span className="text-surface-300">–</span>
                  <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" min="0" className="input w-full" />
                </div>
              </div>

              {/* Rent Period */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400">Rent Period</label>
                <div className="mt-2 space-y-1.5">
                  {RENT_PERIODS.map((rp) => (
                    <label key={rp.value} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-50">
                      <input
                        type="radio"
                        name="rentPeriod"
                        value={rp.value}
                        checked={rentPeriod === rp.value}
                        onChange={(e) => setRentPeriod(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-slate-700">{rp.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400">Sort By</label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="select mt-1.5 w-full">
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-surface-400">{totalText}</p>
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {query && <FilterChip label={`"${query}"`} onRemove={() => { setQuery(''); fetchListings(false); }} />}
                  {categoryId && (
                    <FilterChip
                      label={categories.find((c) => c.id === categoryId)?.name || 'Category'}
                      onRemove={() => setCategoryId('')}
                    />
                  )}
                  {city && <FilterChip label={city} onRemove={() => setCity('')} />}
                  {(minPrice || maxPrice) && (
                    <FilterChip
                      label={`₹${minPrice || '0'} – ₹${maxPrice || '∞'}`}
                      onRemove={() => { setMinPrice(''); setMaxPrice(''); }}
                    />
                  )}
                  {rentPeriod && <FilterChip label={rentPeriod} onRemove={() => setRentPeriod('')} />}
                </div>
              )}
            </div>

            {loading && listings.length === 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="skeleton aspect-[16/10]" />
                    <div className="space-y-3 p-4">
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                      <div className="skeleton h-5 w-1/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="mt-16 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-100 text-5xl">🔍</div>
                <h3 className="mt-6 text-lg font-bold text-slate-900">No listings found</h3>
                <p className="mt-2 text-sm text-surface-400">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="btn-secondary mt-6">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      price={listing.price}
                      rentPeriod={listing.rentPeriod}
                      city={listing.city}
                      state={listing.state}
                      images={listing.images}
                      imageUrl={listing.images?.[0]?.url}
                      categoryName={listing.category?.name}
                      categorySlug={listing.category?.slug}
                      ownerName={listing.owner?.profile?.fullName}
                      isFeatured={listing.isFeatured}
                      createdAt={listing.createdAt}
                      amenities={listing.amenities}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => fetchListings(true)}
                      disabled={loading}
                      className="btn-secondary px-8 py-2.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /> Loading...</>
                      ) : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-100">
      {label}
      <button onClick={onRemove} className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary-200 text-primary-700 transition-colors hover:bg-primary-300">
        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </span>
  );
}
