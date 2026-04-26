'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Stats {
  users: {
    total: number; active: number; newThisMonth: number; newThisWeek: number;
    roleBreakdown: { role: string; count: number }[];
  };
  listings: {
    total: number; active: number; pending: number; rejected: number;
    featured: number; newThisMonth: number;
    categoryBreakdown: { name: string; count: number }[];
  };
  engagement: { totalConversations: number; totalMessages: number; pendingReports: number };
  revenue: { totalPayments: number; totalRevenue: number };
  subscription: {
    activeSubscriptions: number;
    totalPlans: number;
    planUtilization: {
      planId: string;
      planName: string;
      subscribers: number;
      avgListingsUsagePct: number;
      avgContactRevealUsagePct: number;
      avgBookingsUsagePct: number;
      avgInquiriesUsagePct: number;
    }[];
    quotaBreaches: {
      listings: number;
      contactReveals: number;
      bookings: number;
      inquiries: number;
    };
  };
  categories: number;
}

interface RecentActivity {
  recentUsers: any[];
  recentListings: any[];
  recentReports: any[];
  recentLogs: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/stats/recent-activity'),
    ]).then(([statsRes, activityRes]) => {
      setStats(statsRes.data);
      setActivity(activityRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-slate-500">Failed to load dashboard data.</p>;

  const statCards = [
    { label: 'Total Users', value: stats.users.total, change: `+${stats.users.newThisWeek} this week`, color: 'indigo', href: '/admin/users' },
    { label: 'Active Listings', value: stats.listings.active, change: `${stats.listings.pending} pending`, color: 'emerald', href: '/admin/listings' },
    { label: 'Pending Approval', value: stats.listings.pending, change: 'Needs review', color: 'amber', href: '/admin/listings?status=PENDING_APPROVAL' },
    { label: 'Total Revenue', value: `₹${Number(stats.revenue.totalRevenue).toLocaleString()}`, change: `${stats.revenue.totalPayments} payments`, color: 'violet', href: '/admin/plans' },
    { label: 'Owners', value: stats.users.roleBreakdown.find(r => r.role === 'OWNER')?.count || 0, change: 'Registered owners', color: 'blue', href: '/admin/users?role=OWNER' },
    { label: 'Renters', value: stats.users.roleBreakdown.find(r => r.role === 'RENTER')?.count || 0, change: 'Registered renters', color: 'teal', href: '/admin/users?role=RENTER' },
    { label: 'Conversations', value: stats.engagement.totalConversations, change: `${stats.engagement.totalMessages} messages`, color: 'sky', href: '#' },
    { label: 'Pending Reports', value: stats.engagement.pendingReports, change: 'Needs attention', color: 'red', href: '/admin/reports' },
    { label: 'Active Subscriptions', value: stats.subscription.activeSubscriptions, change: `${stats.subscription.totalPlans} active plans`, color: 'indigo', href: '/admin/plans' },
    {
      label: 'Quota Breaches',
      value:
        stats.subscription.quotaBreaches.listings +
        stats.subscription.quotaBreaches.contactReveals +
        stats.subscription.quotaBreaches.bookings +
        stats.subscription.quotaBreaches.inquiries,
      change: 'Users at/over plan limits',
      color: 'amber',
      href: '/admin/plans',
    },
  ];

  const COLORS: Record<string, { bg: string; text: string; accent: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', accent: 'bg-indigo-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'bg-emerald-500' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   accent: 'bg-amber-500' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  accent: 'bg-violet-500' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    accent: 'bg-blue-500' },
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    accent: 'bg-teal-500' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     accent: 'bg-sky-500' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     accent: 'bg-red-500' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your rental marketplace platform</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const c = COLORS[card.color] || COLORS.indigo;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md`}
            >
              <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full ${c.accent} opacity-10 transition-transform group-hover:scale-125`} />
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className={`mt-2 text-3xl font-bold ${c.text}`}>{card.value}</p>
              <p className="mt-1 text-xs text-slate-400">{card.change}</p>
            </Link>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Listings by Category</h3>
            <Link href="/admin/categories" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Manage →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {stats.listings.categoryBreakdown.map((cat) => {
              const max = Math.max(...stats.listings.categoryBreakdown.map(c => c.count), 1);
              const pct = Math.round((cat.count / max) * 100);
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-slate-500">{cat.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recent Signups</h3>
            <Link href="/admin/users" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View All →</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {activity?.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {u.profile?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.profile?.fullName || u.email}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  u.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                  u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
            {(!activity?.recentUsers.length) && (
              <p className="py-4 text-center text-sm text-slate-400">No recent signups</p>
            )}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recent Listings</h3>
            <Link href="/admin/listings" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View All →</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {activity?.recentListings.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{l.title}</p>
                  <p className="text-xs text-slate-400">
                    {l.category?.name} · by {l.owner?.profile?.fullName}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">₹{Number(l.price).toLocaleString()}</span>
                  <StatusBadge status={l.status} />
                </div>
              </div>
            ))}
            {(!activity?.recentListings.length) && (
              <p className="py-4 text-center text-sm text-slate-400">No listings yet</p>
            )}
          </div>
        </div>

        {/* Admin Activity Log */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Admin Activity</h3>
            <Link href="/admin/audit-log" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View All →</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {activity?.recentLogs.map((log: any) => (
              <div key={log.id} className="py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{log.admin?.profile?.fullName}</span>{' '}
                      <span className="text-slate-500">{formatAction(log.action)}</span>{' '}
                      <span className="font-medium">{log.entity.toLowerCase()}</span>
                    </p>
                    <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!activity?.recentLogs.length) && (
              <p className="py-4 text-center text-sm text-slate-400">No admin activity yet</p>
            )}
          </div>
        </div>

        {/* Plan Utilization */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Subscription Utilization</h3>
            <Link href="/admin/plans" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Manage Plans →</Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniMetric label="Listing breaches" value={stats.subscription.quotaBreaches.listings} tone="amber" />
            <MiniMetric label="Reveal breaches" value={stats.subscription.quotaBreaches.contactReveals} tone="red" />
            <MiniMetric label="Booking breaches" value={stats.subscription.quotaBreaches.bookings} tone="orange" />
            <MiniMetric label="Inquiry breaches" value={stats.subscription.quotaBreaches.inquiries} tone="violet" />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Subscribers</th>
                  <th className="py-2 pr-3">Listings Usage</th>
                  <th className="py-2 pr-3">Reveals Usage</th>
                  <th className="py-2 pr-3">Bookings Usage</th>
                  <th className="py-2">Inquiries Usage</th>
                </tr>
              </thead>
              <tbody>
                {stats.subscription.planUtilization.map((p) => (
                  <tr key={p.planId} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-800">{p.planName}</td>
                    <td className="py-2 pr-3 text-slate-600">{p.subscribers}</td>
                    <td className="py-2 pr-3 text-slate-600">{p.avgListingsUsagePct}%</td>
                    <td className="py-2 pr-3 text-slate-600">{p.avgContactRevealUsagePct}%</td>
                    <td className="py-2 pr-3 text-slate-600">{p.avgBookingsUsagePct}%</td>
                    <td className="py-2 text-slate-600">{p.avgInquiriesUsagePct}%</td>
                  </tr>
                ))}
                {stats.subscription.planUtilization.length === 0 && (
                  <tr>
                    <td className="py-4 text-center text-slate-400" colSpan={6}>No subscription utilization data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'red' | 'orange' | 'violet' }) {
  const tones: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className={`rounded-lg px-3 py-2 ${tones[tone]}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
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
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.DRAFT}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatAction(action: string): string {
  return action.toLowerCase().replace(/_/g, ' ');
}
