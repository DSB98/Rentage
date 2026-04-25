'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isOwner = user?.role === 'OWNER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-primary-600">
            Rentage
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.profile?.fullName}
            </span>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              {user?.role}
            </span>
            <button
              onClick={() => logout().then(() => router.push('/'))}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            <SidebarLink href="/dashboard" label="Dashboard" />
            {isOwner && <SidebarLink href="/my-listings" label="My Listings" />}
            {isOwner && <SidebarLink href="/create-listing" label="Create Listing" />}
            <SidebarLink href="/saved" label="Saved" />
            <SidebarLink href="/chat" label="Messages" />
            <SidebarLink href="/profile" label="Profile" />
            <SidebarLink href="/subscription" label="Subscription" />
            {isAdmin && <SidebarLink href="/admin" label="Admin Panel" />}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
    >
      {label}
    </Link>
  );
}
