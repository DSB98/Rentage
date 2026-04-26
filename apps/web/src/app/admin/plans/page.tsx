'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Plan {
  id: string; name: string; slug: string; description?: string;
  audience: 'OWNER' | 'RENTER' | 'AGENCY';
  price: number; currency: string; interval: string;
  maxListings: number; maxContactReveals: number; maxBookingsPerMonth: number; maxInquiriesPerMonth: number;
  trialDays: number; razorpayPlanId?: string | null;
  features: any;
  isActive: boolean; isPublic: boolean; sortOrder: number;
  _count: { subscriptions: number };
}

const emptyForm = {
  name: '', slug: '', description: '', audience: 'OWNER', price: 0, currency: 'INR', interval: 'monthly',
  maxListings: 5, maxContactReveals: 10, maxBookingsPerMonth: 0, maxInquiriesPerMonth: 0,
  trialDays: 0, razorpayPlanId: '', features: '', isActive: true, isPublic: true, sortOrder: 0,
};

const showAlert = (message: string) => {
  (globalThis as any)?.alert?.(message);
};

const showConfirm = (message: string) => {
  return Boolean((globalThis as any)?.confirm?.(message));
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/admin/plans');
      setPlans(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (plan: Plan) => {
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      audience: plan.audience,
      price: Number(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      maxListings: plan.maxListings,
      maxContactReveals: plan.maxContactReveals,
      maxBookingsPerMonth: plan.maxBookingsPerMonth,
      maxInquiriesPerMonth: plan.maxInquiriesPerMonth,
      trialDays: plan.trialDays,
      razorpayPlanId: plan.razorpayPlanId || '',
      features: plan.features ? JSON.stringify(plan.features, null, 2) : '',
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f, name,
      slug: editingId ? f.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        maxListings: Number(form.maxListings),
        maxContactReveals: Number(form.maxContactReveals),
        maxBookingsPerMonth: Number(form.maxBookingsPerMonth),
        maxInquiriesPerMonth: Number(form.maxInquiriesPerMonth),
        trialDays: Number(form.trialDays),
        razorpayPlanId: form.razorpayPlanId?.trim() || null,
        sortOrder: Number(form.sortOrder),
        features: form.features ? JSON.parse(form.features) : null,
      };
      if (editingId) {
        await api.patch(`/admin/plans/${editingId}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      resetForm();
      fetchPlans();
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to save plan');
    } finally {
      setFormLoading(false);
    }
  };

  const deletePlan = async (plan: Plan) => {
    if (plan._count.subscriptions > 0) {
      showAlert(`Cannot delete "${plan.name}" - it has ${plan._count.subscriptions} active subscriptions.`);
      return;
    }
    if (!showConfirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/plans/${plan.id}`);
      fetchPlans();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await api.patch(`/admin/plans/${plan.id}`, { isActive: !plan.isActive });
      fetchPlans();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Configure pricing and limits for your marketplace</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Plan
        </button>
      </div>

      {/* Plans Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative overflow-hidden rounded-2xl border-2 p-6 transition ${
              plan.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
            }`}
          >
            {!plan.isActive && (
              <div className="absolute right-3 top-3 rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">Inactive</div>
            )}

            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                plan.price === 0 ? 'bg-slate-100' :
                Number(plan.price) < 300 ? 'bg-blue-100' : 'bg-violet-100'
              }`}>
                {plan.price === 0 ? '🆓' : Number(plan.price) < 300 ? '⭐' : '👑'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-400">Order: {plan.sortOrder} · {plan._count.subscriptions} subscribers</p>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-900">₹{Number(plan.price).toLocaleString()}</span>
              <span className="text-sm text-slate-500">/{plan.interval}</span>
            </div>

              <p className="mt-1 text-xs font-medium text-slate-500">Audience: {plan.audience}</p>

            <div className="mt-4 space-y-2">
              <LimitRow label="Max Listings" value={plan.maxListings === -1 ? 'Unlimited' : plan.maxListings.toString()} />
              <LimitRow label="Contact Reveals" value={plan.maxContactReveals === -1 ? 'Unlimited' : `${plan.maxContactReveals}/mo`} />
                <LimitRow label="Bookings/Month" value={plan.maxBookingsPerMonth <= 0 ? 'Unlimited' : `${plan.maxBookingsPerMonth}`} />
                <LimitRow label="Inquiries/Month" value={plan.maxInquiriesPerMonth <= 0 ? 'Unlimited' : `${plan.maxInquiriesPerMonth}`} />
            </div>

            {plan.description && (
              <p className="mt-3 text-xs text-slate-400">{plan.description}</p>
            )}

            {plan.features && (
              <div className="mt-3 flex flex-wrap gap-1">
                {(Array.isArray(plan.features) ? plan.features : Object.values(plan.features)).map((f: any, i: number) => (
                  <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">{String(f)}</span>
                ))}
              </div>
            )}

            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => startEdit(plan)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                onClick={() => toggleActive(plan)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium ${
                  plan.isActive ? 'border border-amber-200 text-amber-600 hover:bg-amber-50' : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {plan.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => deletePlan(plan)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Edit Plan' : 'New Plan'}
            </h3>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
                  <input value={form.name} onChange={(e: any) => handleNameChange(e.target.value)} required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Slug *</label>
                  <input value={form.slug} onChange={(e: any) => setForm(f => ({ ...f, slug: e.target.value }))} required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <textarea value={form.description} onChange={(e: any) => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Audience</label>
                  <select value={form.audience} onChange={(e: any) => setForm(f => ({ ...f, audience: e.target.value as any }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="OWNER">Owner</option>
                    <option value="RENTER">Renter</option>
                    <option value="AGENCY">Agency</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e: any) => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Interval</label>
                  <select value={form.interval} onChange={(e: any) => setForm(f => ({ ...f, interval: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e: any) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Max Listings (-1 = unlimited)</label>
                  <input type="number" value={form.maxListings} onChange={(e: any) => setForm(f => ({ ...f, maxListings: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Max Contact Reveals/mo (-1 = unlimited)</label>
                  <input type="number" value={form.maxContactReveals} onChange={(e: any) => setForm(f => ({ ...f, maxContactReveals: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Max Bookings/Month (0 = unlimited)</label>
                  <input type="number" value={form.maxBookingsPerMonth} onChange={(e: any) => setForm(f => ({ ...f, maxBookingsPerMonth: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Max Inquiries/Month (0 = unlimited)</label>
                  <input type="number" value={form.maxInquiriesPerMonth} onChange={(e: any) => setForm(f => ({ ...f, maxInquiriesPerMonth: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Trial Days</label>
                  <input type="number" value={form.trialDays} onChange={(e: any) => setForm(f => ({ ...f, trialDays: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Razorpay Plan ID</label>
                  <input value={form.razorpayPlanId} onChange={(e: any) => setForm(f => ({ ...f, razorpayPlanId: e.target.value }))}
                    placeholder="plan_XXXXXXXX"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Features (JSON array)</label>
                <textarea value={form.features} onChange={(e: any) => setForm(f => ({ ...f, features: e.target.value }))} rows={3}
                  placeholder='["Priority support", "Featured badge"]'
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none" />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e: any) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Active
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublic}
                  onChange={(e: any) => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Publicly visible
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={resetForm}
                className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={formLoading}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {formLoading ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
