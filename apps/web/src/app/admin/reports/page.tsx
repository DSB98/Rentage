'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('PENDING');
  const [actionModal, setActionModal] = useState<{ id: string; type: 'resolve' | 'dismiss'; title: string } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (statusTab) params.set('status', statusTab);
      const { data } = await api.get(`/admin/reports?${params}`);
      setReports(data.reports);
      setMeta(data.meta);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusTab]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal.type === 'resolve') {
        await api.patch(`/admin/reports/${actionModal.id}/resolve`, {
          action: 'resolve', adminNotes: actionNotes,
        });
      } else {
        await api.patch(`/admin/reports/${actionModal.id}/dismiss`, {
          adminNotes: actionNotes,
        });
      }
      setActionModal(null);
      setActionNotes('');
      fetchReports(meta.page);
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Review flagged content from users</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              statusTab === tab.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20">
          <svg className="h-12 w-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-sm text-slate-500">No reports to show</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-slate-900">Reason: {report.reason}</h3>
                  {report.description && (
                    <p className="mt-1 text-sm text-slate-600">{report.description}</p>
                  )}

                  <div className="mt-3 flex gap-6 text-xs text-slate-500">
                    <div>
                      <span className="text-slate-400">Reporter:</span>{' '}
                      <span className="font-medium">{report.reporter?.profile?.fullName || report.reporter?.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Listing:</span>{' '}
                      <Link href={`/listings/${report.listing?.id}`} target="_blank" className="font-medium text-indigo-600 hover:text-indigo-700">
                        {report.listing?.title}
                      </Link>
                    </div>
                    <div>
                      <span className="text-slate-400">Owner:</span>{' '}
                      <span className="font-medium">{report.listing?.owner?.profile?.fullName || report.listing?.owner?.email}</span>
                    </div>
                  </div>

                  {report.adminNotes && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      <span className="font-semibold">Admin Notes:</span> {report.adminNotes}
                      {report.resolvedBy && (
                        <span className="text-slate-400"> — by {report.resolvedBy.profile?.fullName}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Listing thumbnail */}
                {report.listing?.images?.[0]?.url && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <img src={report.listing.images[0].url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Actions */}
              {report.status === 'PENDING' && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setActionModal({ id: report.id, type: 'resolve', title: report.listing?.title })}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => setActionModal({ id: report.id, type: 'dismiss', title: report.listing?.title })}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchReports(meta.page - 1)} disabled={meta.page <= 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-white disabled:opacity-40">Previous</button>
            <button onClick={() => fetchReports(meta.page + 1)} disabled={meta.page >= meta.totalPages}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-white disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {actionModal.type === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {actionModal.type === 'resolve'
                ? `Take action on the reported listing "${actionModal.title}"`
                : 'Dismiss this report as not actionable'}
            </p>
            <textarea
              value={actionNotes}
              onChange={(e: any) => setActionNotes(e.target.value)}
              placeholder="Admin notes (optional)..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setActionModal(null); setActionNotes(''); }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAction} disabled={actionLoading}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  actionModal.type === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'
                }`}>
                {actionLoading ? 'Processing...' : actionModal.type === 'resolve' ? 'Resolve' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
