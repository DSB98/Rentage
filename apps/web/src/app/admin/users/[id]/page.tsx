'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get(`/admin/users/${id}`).then(({ data }) => setUser(data))
      .catch(() => router.push('/admin/users'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const toggleActive = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle-active`);
      setUser((u: any) => ({ ...u, isActive: data.isActive }));
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const changeRole = async (role: string) => {
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUser((u: any) => ({ ...u, role: data.role }));
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 lg:col-span-1" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/users" className="text-slate-400 hover:text-indigo-600">Users</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700">{user.profile?.fullName || user.email}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-2xl font-bold text-white">
              {user.profile?.fullName?.charAt(0) || '?'}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{user.profile?.fullName || 'No name'}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>

            <div className="mt-3 flex gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {user.role}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <InfoRow label="Phone" value={user.profile?.phone || '—'} />
            <InfoRow label="City" value={user.profile?.city || '—'} />
            <InfoRow label="State" value={user.profile?.state || '—'} />
            <InfoRow label="Verified" value={user.isEmailVerified ? 'Yes' : 'No'} />
            <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            <InfoRow label="Updated" value={new Date(user.updatedAt).toLocaleDateString()} />
          </div>

          {/* Actions */}
          {user.role !== 'ADMIN' && (
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
              <button
                onClick={toggleActive}
                disabled={actionLoading}
                className={`w-full rounded-lg py-2 text-sm font-medium transition ${
                  user.isActive
                    ? 'border border-red-200 text-red-600 hover:bg-red-50'
                    : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Processing...' : user.isActive ? 'Deactivate Account' : 'Activate Account'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => changeRole('OWNER')}
                  disabled={actionLoading || user.role === 'OWNER'}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                    user.role === 'OWNER'
                      ? 'bg-blue-100 text-blue-700'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  Set Owner
                </button>
                <button
                  onClick={() => changeRole('RENTER')}
                  disabled={actionLoading || user.role === 'RENTER'}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                    user.role === 'RENTER'
                      ? 'bg-green-100 text-green-700'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  Set Renter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Listings" value={user._count?.ownedListings || 0} color="blue" />
            <StatCard label="Saved" value={user._count?.savedListings || 0} color="red" />
            <StatCard label="Messages" value={user._count?.sentMessages || 0} color="green" />
          </div>

          {/* Subscription */}
          {user.subscription && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-indigo-700">{user.subscription.plan?.name}</p>
                  <p className="text-sm text-slate-500">₹{Number(user.subscription.plan?.price).toLocaleString()}/month</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  user.subscription.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {user.subscription.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Expires: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Recent Listings */}
          {user.recentListings?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Recent Listings</h3>
              <div className="mt-3 divide-y divide-slate-100">
                {user.recentListings.map((listing: any) => (
                  <div key={listing.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {listing.images?.[0]?.url ? (
                        <img src={listing.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">No img</div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{listing.title}</p>
                        <p className="text-xs text-slate-400">{listing.category?.name} · ₹{Number(listing.price).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      listing.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      listing.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{listing.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {user.recentPayments?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Payment History</h3>
              <div className="mt-3 divide-y divide-slate-100">
                {user.recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">₹{Number(payment.amount).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{new Date(payment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      payment.status === 'CAPTURED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{payment.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.profile?.bio && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Bio</h3>
              <p className="mt-2 text-sm text-slate-600">{user.profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  };
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4`}>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colors[color]?.split(' ')[1] || 'text-slate-700'}`}>{value}</p>
    </div>
  );
}
