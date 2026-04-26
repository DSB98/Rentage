'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Category {
  id: string; name: string; slug: string; description?: string; icon?: string;
  sortOrder: number; isActive: boolean;
  _count: { listings: number };
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', sortOrder: 0 });

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editingId ? f.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingId) {
        await api.patch(`/admin/categories/${editingId}`, form);
      } else {
        await api.post('/admin/categories', form);
      }
      resetForm();
      fetchCategories();
    } catch (err: any) {
      (globalThis as any)?.alert?.(err.response?.data?.message || 'Failed to save category');
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
      sortOrder: cat.sortOrder,
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const toggleActive = async (cat: Category) => {
    try {
      await api.patch(`/admin/categories/${cat.id}`, { isActive: !cat.isActive });
      fetchCategories();
    } catch (err: any) {
      (globalThis as any)?.alert?.(err.response?.data?.message || 'Failed to update category');
    }
  };

  const deleteCategory = async (cat: Category) => {
    if (cat._count.listings > 0) {
      (globalThis as any)?.alert?.(`Cannot delete "${cat.name}" — it has ${cat._count.listings} listings. Reassign them first.`);
      return;
    }
    if (!(globalThis as any)?.confirm?.(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/categories/${cat.id}`);
      fetchCategories();
    } catch (err: any) {
      (globalThis as any)?.alert?.(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} categories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            {editingId ? 'Edit Category' : 'New Category'}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
              <input
                value={form.name}
                onChange={(e: any) => handleNameChange(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Slug *</label>
              <input
                value={form.slug}
                onChange={(e: any) => setForm((f) => ({ ...f, slug: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Icon (emoji)</label>
              <input
                value={form.icon}
                onChange={(e: any) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. 🏠"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <input
                value={form.description}
                onChange={(e: any) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e: any) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={formLoading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
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

      {/* Categories Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Slug</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Listings</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg">
                      {cat.icon || '📦'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                      {cat.description && <p className="text-xs text-slate-400">{cat.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{cat.slug}</code>
                </td>
                <td className="px-5 py-4 text-center text-sm font-medium text-slate-700">{cat._count.listings}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-500">{cat.sortOrder}</td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                      cat.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                      title="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteCategory(cat)}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
