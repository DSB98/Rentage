'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      fetchUsers(meta.page);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers(meta.page);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="OWNER">Owner</option>
          <option value="RENTER">Renter</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Listings</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4" colSpan={7}>
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-sm font-semibold text-white">
                          {user.profile?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <Link href={`/admin/users/${user.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                            {user.profile?.fullName || 'No name'}
                          </Link>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {user.role === 'ADMIN' ? (
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">ADMIN</span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value)}
                          disabled={actionLoading === user.id}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="OWNER">OWNER</option>
                          <option value="RENTER">RENTER</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user._count?.ownedListings || 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.profile?.city ? `${user.profile.city}${user.profile.state ? `, ${user.profile.state}` : ''}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                          title="View details"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleActive(user.id)}
                            disabled={actionLoading === user.id}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                              user.isActive
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            } disabled:opacity-50`}
                          >
                            {actionLoading === user.id ? '...' : user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-sm text-slate-500">
              Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(meta.page - 1)}
                disabled={meta.page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
              >
                Previous
              </button>
              {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => fetchUsers(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      p === meta.page ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => fetchUsers(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
