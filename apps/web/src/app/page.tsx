'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import FeaturedCarousel from '@/components/FeaturedCarousel';

const CATEGORY_ICONS: Record<string, string> = {
  homes: '🏠', flats: '🏢', pgs: '🛏️', cars: '🚗', bikes: '🏍️',
  'washing-machines': '🫧', 'water-filters': '💧', electronics: '📱',
  furniture: '🪑', 'tools-equipment': '🔧', others: '📦',
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  homes: 'from-blue-50 to-blue-100/50',
  flats: 'from-violet-50 to-violet-100/50',
  pgs: 'from-pink-50 to-pink-100/50',
  cars: 'from-emerald-50 to-emerald-100/50',
  bikes: 'from-orange-50 to-orange-100/50',
  'washing-machines': 'from-cyan-50 to-cyan-100/50',
  'water-filters': 'from-sky-50 to-sky-100/50',
  electronics: 'from-indigo-50 to-indigo-100/50',
  furniture: 'from-amber-50 to-amber-100/50',
  'tools-equipment': 'from-slate-50 to-slate-100/50',
  others: 'from-gray-50 to-gray-100/50',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  _count?: { listings: number };
}

const STATS = [
  { value: '10K+', label: 'Active Listings', icon: '📋' },
  { value: '50K+', label: 'Happy Renters', icon: '😊' },
  { value: '15+', label: 'Cities', icon: '🏙️' },
  { value: '11', label: 'Categories', icon: '📂' },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    // Fetch categories
    api.get('/categories').then(({ data }) => {
      setCategories(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    }).catch(() => {});

    // Fetch recent listings
    api.get('/listings/search?limit=8&sort=newest').then(({ data }) => {
      const result = data.data || data;
      setRecentListings(result.items || result || []);
    }).catch(() => {}).finally(() => setLoadingListings(false));

    // Fetch featured — ALL featured listings
    api.get('/listings/search?featured=true&limit=50').then(({ data }) => {
      const result = data.data || data;
      setFeaturedListings(result.items || result || []);
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/listings?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50/30" />
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
              </span>
              India&apos;s Rental Marketplace
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Rent Anything,{' '}
              <span className="gradient-text">Anywhere</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-surface-500">
              From homes to bikes, appliances to electronics — find what you need or list what you own.
              Join thousands of renters and owners across India.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="mx-auto mt-10 flex max-w-2xl gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you looking to rent?"
                  className="input-lg pl-12 shadow-card"
                />
              </div>
              <button type="submit" className="btn-primary px-8 py-3.5 text-base shadow-md">
                Search
              </button>
            </form>

            {/* Quick tags */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['Homes', 'Cars', 'Bikes', 'PGs', 'Laptops', 'Furniture'].map((term) => (
                <Link
                  key={term}
                  href={`/listings?q=${term}`}
                  className="rounded-full border border-surface-200 bg-white px-3.5 py-1.5 text-xs font-medium text-surface-500 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── STATS BAR ───── */}
      <section className="relative -mt-8 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-surface-200/60 bg-white p-6 shadow-elevated sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-surface-100">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-0.5 text-xs font-medium text-surface-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CATEGORIES ───── */}
      <section className="section">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="section-heading">Browse by Category</h2>
            <p className="section-subheading">Find exactly what you need from 11 different categories</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/listings?category=${cat.id}`}
                className={`group flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[cat.slug] || 'from-gray-50 to-gray-100/50'} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
              >
                <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{CATEGORY_ICONS[cat.slug] || cat.icon || '📦'}</span>
                <span className="text-sm font-semibold text-slate-700">{cat.name}</span>
                <span className="text-[11px] font-medium text-surface-400">
                  {cat._count?.listings || 0} listings
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FEATURED LISTINGS CAROUSEL ───── */}
      <FeaturedCarousel listings={featuredListings} />

      {/* ───── RECENT LISTINGS ───── */}
      <section className="section bg-surface-50">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-heading">Recent Listings</h2>
              <p className="section-subheading">Fresh items just added by owners across India</p>
            </div>
            <Link href="/listings" className="btn-secondary hidden sm:inline-flex">
              View All
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {loadingListings ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton aspect-[16/10]" />
                  <div className="space-y-2 p-4">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentListings.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recentListings.map((listing: any) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  rentPeriod={listing.rentPeriod}
                  city={listing.city}
                  state={listing.state}
                  imageUrl={listing.images?.[0]?.url}
                  images={listing.images}
                  categoryName={listing.category?.name}
                  categorySlug={listing.category?.slug}
                  ownerName={listing.owner?.profile?.fullName}
                  isFeatured={listing.isFeatured}
                  createdAt={listing.createdAt}
                  amenities={listing.amenities}
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-100 text-4xl">📦</div>
              <p className="mt-4 text-lg font-medium text-slate-700">No listings yet</p>
              <p className="mt-1 text-sm text-surface-400">Be the first to list something!</p>
              <Link href="/register" className="btn-primary mt-5">Start Listing</Link>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/listings" className="btn-secondary">View All Listings →</Link>
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="section bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="section-heading">How It Works</h2>
            <p className="section-subheading">Three simple steps to start renting</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'List or Search',
                desc: 'Owners list their assets with photos, price, and details. Renters search by category, location, or keyword.',
                icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
                gradient: 'from-blue-500 to-primary-600',
              },
              {
                step: '02',
                title: 'Connect & Chat',
                desc: 'Found something you like? Chat with the owner directly, ask questions, and negotiate terms — all within the app.',
                icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
                gradient: 'from-primary-600 to-violet-600',
              },
              {
                step: '03',
                title: 'Rent & Enjoy',
                desc: 'Finalize the deal with the owner, pick up your rental, and enjoy! Payments happen directly between you and the owner.',
                icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                gradient: 'from-violet-600 to-accent-500',
              },
            ].map((item) => (
              <div key={item.step} className="group relative">
                <div className="text-center">
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <span className="mt-4 block text-xs font-bold text-primary-600">{item.step}</span>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to start renting?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-100">
            Join thousands of owners and renters across India. List your first item in under 2 minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register" className="btn-accent px-8 py-3.5 text-base shadow-lg">
              Get Started Free
            </Link>
            <Link href="/listings" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
