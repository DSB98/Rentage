'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const ENTITY_FILTERS = ['', 'USER', 'LISTING', 'CATEGORY', 'PLAN', 'REPORT'];

const ACTION_COLORS: Record<string, string> = {
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT: 'bg-red-100 text-red-700',
  ACTIVATE: 'bg-emerald-100 text-emerald-700',
  DEACTIVATE: 'bg-red-100 text-red-700',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  REMOVE: 'bg-red-100 text-red-700',
  FEATURE: 'bg-amber-100 text-amber-700',
  UNFEATURE: 'bg-slate-100 text-slate-600',
  CHANGE: 'bg-violet-100 text-violet-700',
  RESOLVE: 'bg-emerald-100 text-emerald-700',
  DISMISS: 'bg-slate-100 text-slate-600',
};

function getActionColor(action: string): string {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.includes(key)) return ACTION_COLORS[key];
  }
  return 'bg-slate-100 text-slate-600';
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionSearch, setActionSearch] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');
      if (entityFilter) params.set('entity', entityFilter);
      if (actionSearch) params.set('action', actionSearch);
      const { data } = await api.get(`/admin/audit-log?${params}`);
      setLogs(data.logs);
      setMeta(data.meta);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [entityFilter, actionSearch]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">Complete history of all admin actions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={actionSearch}
            onChange={(e: any) => setActionSearch(e.target.value)}
            placeholder="Search by action (e.g. APPROVE, CREATE)..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e: any) => setEntityFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Entities</option>
          {ENTITY_FILTERS.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-200" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20">
          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-3 text-sm text-slate-500">No audit logs found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Admin</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Entity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {log.admin?.profile?.fullName?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm text-slate-700">{log.admin?.profile?.fullName || log.admin?.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{log.entity}</span>
                      <span className="ml-2 text-xs text-slate-400">{log.entityId.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="max-w-xs px-5 py-3">
                    {log.details ? (
                      <div className="text-xs text-slate-500">
                        {Object.entries(log.details).map(([key, val]) => (
                          <span key={key} className="mr-3">
                            <span className="text-slate-400">{key}:</span>{' '}
                            <span className="font-medium">{String(val).substring(0, 40)}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => fetchLogs(meta.page - 1)} disabled={meta.page <= 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-white disabled:opacity-40">Previous</button>
            <button onClick={() => fetchLogs(meta.page + 1)} disabled={meta.page >= meta.totalPages}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-white disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
