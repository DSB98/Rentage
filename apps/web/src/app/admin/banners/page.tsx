'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Banner {
  id: string;
  title?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  title: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/admin/banners');
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (banner: Banner) => {
    setForm({
      title: banner.title || '',
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        title: form.title.trim() || null,
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (editingId) {
        await api.patch(`/admin/banners/${editingId}`, payload);
      } else {
        await api.post('/admin/banners', payload);
      }

      resetForm();
      fetchBanners();
    } catch (err: any) {
      (globalThis as any)?.alert?.(err.response?.data?.message || 'Failed to save banner');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteBanner = async (banner: Banner) => {
    if (!(globalThis as any)?.confirm?.('Delete this banner? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/banners/${banner.id}`);
      fetchBanners();
    } catch (err: any) {
      (globalThis as any)?.alert?.(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await api.patch(`/admin/banners/${banner.id}`, { isActive: !banner.isActive });
      fetchBanners();
    } catch (err: any) {
      (globalThis as any)?.alert?.(err.response?.data?.message || 'Failed to update banner status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homepage Banners</h1>
          <p className="mt-1 text-sm text-slate-500">Manage rotating hero banners for the landing page</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          <h3 className="text-sm font-semibold text-slate-900">{editingId ? 'Edit Banner' : 'New Banner'}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Image URL *</label>
              <input
                value={form.imageUrl}
                onChange={(e: any) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                required
                placeholder="/banners/banner.png or https://..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Title (optional)</label>
              <input
                value={form.title}
                onChange={(e: any) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Link URL (optional)</label>
              <input
                value={form.linkUrl}
                onChange={(e: any) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="/listings?category=cars"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e: any) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e: any) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Active banner
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={formLoading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Preview</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Details</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {banners.map((banner) => (
              <tr key={banner.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="h-14 w-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="h-full w-full object-cover" />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">{banner.title || 'Untitled banner'}</p>
                  <p className="max-w-md truncate text-xs text-slate-500">{banner.imageUrl}</p>
                  {banner.linkUrl ? <p className="max-w-md truncate text-xs text-indigo-600">{banner.linkUrl}</p> : null}
                </td>
                <td className="px-5 py-4 text-center text-sm text-slate-600">{banner.sortOrder}</td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                      banner.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => startEdit(banner)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                      title="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteBanner(banner)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                  No banners yet. Add your first homepage banner.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
