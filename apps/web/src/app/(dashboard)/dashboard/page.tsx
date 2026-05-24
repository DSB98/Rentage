'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';
  const isRenter = user?.role === 'RENTER';

  const [stats, setStats] = useState({
    myListings: 0,
    activeListings: 0,
    savedCount: 0,
    pendingCount: 0,
  });

  useEffect(() => {
    if (isOwner) {
      api.get('/listings/owner/my-listings').then(({ data }) => {
        const listings = data.data || data || [];
        setStats((s) => ({
          ...s,
          myListings: listings.length,
          activeListings: listings.filter((l: any) => l.status === 'ACTIVE').length,
          pendingCount: listings.filter((l: any) => l.status === 'PENDING_APPROVAL').length,
        }));
      }).catch(() => {});
    }

    api.get('/listings/user/saved').then(({ data }) => {
      const saved = data.data || data || [];
      setStats((s) => ({ ...s, savedCount: saved.length }));
    }).catch(() => {});
  }, [isOwner]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome back, {user?.profile?.fullName?.split(' ')[0] || 'User'}!
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {isOwner ? 'Manage your listings and track inquiries' : 'Find and save items you want to rent'}
      </p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isOwner && (
          <>
            <DashboardCard
              title="Total Listings"
              value={stats.myListings.toString()}
              href="/my-listings"
              color="blue"
            />
            <DashboardCard
              title="Active Listings"
              value={stats.activeListings.toString()}
              href="/my-listings?status=ACTIVE"
              color="green"
            />
            <DashboardCard
              title="Pending Approval"
              value={stats.pendingCount.toString()}
              href="/my-listings?status=PENDING_APPROVAL"
              color="yellow"
            />
          </>
        )}
        <DashboardCard
          title="Saved Listings"
          value={stats.savedCount.toString()}
          href="/saved"
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isOwner && (
            <Link
              href="/create-listing"
              className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-lg">
                ➕
              </div>
              <div>
                <p className="font-medium text-gray-900">Create New Listing</p>
                <p className="text-xs text-gray-500">List a new item for rent</p>
              </div>
            </Link>
          )}
          <Link
            href="/listings"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg">
              🔍
            </div>
            <div>
              <p className="font-medium text-gray-900">Browse Listings</p>
              <p className="text-xs text-gray-500">Find items to rent</p>
            </div>
          </Link>
          <Link
            href="/saved"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-lg">
              ❤️
            </div>
            <div>
              <p className="font-medium text-gray-900">Saved Listings</p>
              <p className="text-xs text-gray-500">View your favorites</p>
            </div>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-lg">
              💬
            </div>
            <div>
              <p className="font-medium text-gray-900">Messages</p>
              <p className="text-xs text-gray-500">Chat with owners or renters</p>
            </div>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-lg">
              👤
            </div>
            <div>
              <p className="font-medium text-gray-900">Profile</p>
              <p className="text-xs text-gray-500">Update your details</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Upgrade CTA for RENTER users */}
      {isRenter && (
        <div className="mt-8">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">Want to do more on Rentage?</h2>
            <p className="mt-1 text-sm text-slate-600">
              Upgrade your account to unlock powerful tools — list properties, manage bookings, and grow your rental business.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-2xl">🏠</div>
                <h3 className="mt-3 font-semibold text-slate-900">Become a Property Owner</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600">
                  List your properties, set your own pricing, and start earning rental income on Rentage.
                </p>
                <Link
                  href="/support"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Request Upgrade
                </Link>
              </div>
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-2xl">🤝</div>
                <h3 className="mt-3 font-semibold text-slate-900">Work as an Agent</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600">
                  Help owners and renters connect. Build your client base and earn commissions on every successful deal.
                </p>
                <Link
                  href="/support"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Request Upgrade
                </Link>
              </div>
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-2xl">🏢</div>
                <h3 className="mt-3 font-semibold text-slate-900">Start an Agency</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600">
                  Scale your real estate business. Manage a team, access bulk listing tools, and grow your brand.
                </p>
                <Link
                  href="/support"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Request Upgrade
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const COLORS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

function DashboardCard({ title, value, href, color }: { title: string; value: string; href: string; color: string }) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-5 transition hover:shadow-sm ${COLORS[color] || COLORS.blue}`}
    >
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </Link>
  );
}
