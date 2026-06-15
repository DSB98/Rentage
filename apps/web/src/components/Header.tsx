'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import NotificationBell from './NotificationBell';

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}

function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onScroll = () => setScrolled((globalThis as any).scrollY > 10);
    (globalThis as any).addEventListener('scroll', onScroll, { passive: true });
    return () => (globalThis as any).removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const isOwner = user?.role === 'OWNER';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/listings', label: 'Browse', active: pathname.startsWith('/listings') },
  ];

  const browseCategories = [
    { label: 'Homes', href: '/listings?category=homes' },
    { label: 'Flats', href: '/listings?category=flats' },
    { label: 'PGs', href: '/listings?category=pgs' },
    { label: 'Cars', href: '/listings?category=cars' },
    { label: 'Bikes', href: '/listings?category=bikes' },
    { label: 'Electronics', href: '/listings?category=electronics' },
    { label: 'Furniture', href: '/listings?category=furniture' },
    { label: 'Appliances', href: '/listings?category=washing-machines' },
  ];

  const activeCategory = (searchParams.get('category') || '').toLowerCase();

  const isCategoryLinkActive = (href: string) => {
    const slug = (href.split('category=')[1] || '').toLowerCase();
    return pathname.startsWith('/listings') && activeCategory === slug;
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-surface-200/60 bg-white/80 shadow-sm backdrop-blur-xl'
            : 'bg-white/95 backdrop-blur-sm'
        }`}
      >
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Rent<span className="text-primary-600">age</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {browseCategories.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isCategoryLinkActive(item.href)
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-surface-500 hover:bg-surface-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex gap-2">
                <div className="skeleton h-9 w-9 rounded-xl" />
                <div className="skeleton h-9 w-20 rounded-xl" />
              </div>
            ) : isAuthenticated ? (
              <>
                {isOwner && (
                  <Link href="/create-listing" className="btn-primary hidden sm:inline-flex">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>List Item</span>
                  </Link>
                )}

                <Link
                  href="/saved"
                  className={`relative rounded-xl p-2.5 transition-colors ${
                    pathname === '/saved' ? 'bg-primary-50 text-primary-600' : 'text-surface-400 hover:bg-surface-50 hover:text-slate-900'
                  }`}
                  title="Saved"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </Link>

                <Link
                  href="/chat"
                  className={`relative rounded-xl p-2.5 transition-colors ${
                    pathname === '/chat' ? 'bg-primary-50 text-primary-600' : 'text-surface-400 hover:bg-surface-50 hover:text-slate-900'
                  }`}
                  title="Messages"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </Link>

                <NotificationBell />

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white shadow-sm">
                      {user?.profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-700 sm:block">
                      {user?.profile?.fullName?.split(' ')[0]}
                    </span>
                    <svg className={`hidden h-4 w-4 text-surface-400 transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-scale-in rounded-2xl border border-surface-200/60 bg-white py-2 shadow-elevated">
                        <div className="border-b border-surface-100 px-4 pb-3 pt-1">
                          <p className="text-sm font-semibold text-slate-900">{user?.profile?.fullName}</p>
                          <p className="text-xs text-surface-400">{user?.email}</p>
                          <span className="mt-1.5 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                            {user?.role}
                          </span>
                        </div>

                        <div className="py-1">
                          <DropdownLink href="/dashboard" icon="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" label="Dashboard" />

                          {isOwner && (
                            <DropdownLink href="/my-listings" icon="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" label="My Listings" />
                          )}

                          <DropdownLink href="/saved" icon="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" label="Saved Listings" />

                          <DropdownLink href="/profile" icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" label="Profile" />

                          <DropdownLink href="/subscription" icon="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" label="Subscription" />
                        </div>

                        <div className="border-t border-surface-100 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary hidden sm:inline-flex">Login</Link>
                <Link href="/register" className="btn-primary">Sign Up</Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2.5 text-surface-400 hover:bg-surface-50 md:hidden"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="animate-slide-up border-t border-surface-100 bg-white px-4 pb-4 md:hidden">
            <nav className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                    link.active ? 'bg-primary-50 text-primary-700' : 'text-surface-500'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-medium text-surface-500">
                  Login
                </Link>
              )}
              {isOwner && (
                <Link href="/create-listing" className="btn-primary mt-2 w-full text-center">
                  + List Item
                </Link>
              )}
              <div className="mt-2 rounded-lg border border-surface-200 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-surface-400">Browse Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {browseCategories.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-md px-2.5 py-2 text-xs font-medium ${
                        isCategoryLinkActive(item.href)
                          ? 'bg-primary-100 text-primary-900'
                          : 'bg-surface-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

function DropdownLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-surface-50"
    >
      <svg className="h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {label}
    </Link>
  );
}
