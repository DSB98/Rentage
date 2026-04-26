'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

type Plan = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  audience: 'OWNER' | 'RENTER' | 'AGENCY';
  price: number;
  currency: string;
  interval: string;
  maxListings: number;
  maxContactReveals: number;
  maxBookingsPerMonth: number;
  trialDays: number;
  isActive: boolean;
};

type UsagePayload = {
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    plan: {
      id: string;
      name: string;
      price: number;
      interval: string;
    };
  } | null;
  effectivePlan: {
    plan: {
      id: string;
      name: string;
      maxListings: number;
      maxContactReveals: number;
      maxBookingsPerMonth: number;
    } | null;
    source: 'subscription' | 'default_plan' | 'none';
  };
  usage: {
    listings: { used: number; limit: number | null };
    contactReveals: { used: number; limit: number | null };
    bookingsThisMonth: { used: number; limit: number | null };
  };
};

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const audience = useMemo(() => {
    if (!user?.role) {
      return undefined;
    }

    if (user.role === 'OWNER' || user.role === 'AGENT') {
      return 'OWNER';
    }

    if (user.role === 'AGENCY_ADMIN') {
      return 'AGENCY';
    }

    return 'RENTER';
  }, [user?.role]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [plansRes, usageRes] = await Promise.all([
        api.get(`/subscriptions/plans${audience ? `?audience=${audience}` : ''}`),
        api.get('/subscriptions/usage'),
      ]);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setUsage(usageRes.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  const subscribe = async (planId: string) => {
    setActionLoading(true);
    setError('');
    try {
      const { data } = await api.post('/subscriptions', { planId });
      const checkoutUrl = data?.checkout?.shortUrl;
      if (checkoutUrl) {
        (globalThis as any).location.href = checkoutUrl;
        return;
      }
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!(globalThis as any)?.confirm?.('Cancel your current subscription at period end?')) {
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await api.post('/subscriptions/cancel', { atPeriodEnd: true });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlanId = usage?.subscription?.plan?.id || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription & Limits</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a plan and track monthly usage in one place.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <UsageCard
          label="Listings"
          used={usage?.usage.listings.used || 0}
          limit={usage?.usage.listings.limit ?? null}
        />
        <UsageCard
          label="Contact Reveals (This Month)"
          used={usage?.usage.contactReveals.used || 0}
          limit={usage?.usage.contactReveals.limit ?? null}
        />
        <UsageCard
          label="Bookings (This Month)"
          used={usage?.usage.bookingsThisMonth.used || 0}
          limit={usage?.usage.bookingsThisMonth.limit ?? null}
        />
      </div>

      {usage?.subscription && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-900">
            Current Plan: {usage.subscription.plan.name}
          </p>
          <p className="mt-1 text-xs text-indigo-700">
            Status: {usage.subscription.status}{' '}
            {usage.subscription.currentPeriodEnd
              ? `• Renews until ${new Date(usage.subscription.currentPeriodEnd).toLocaleDateString('en-IN')}`
              : ''}
          </p>
          {!usage.subscription.cancelAtPeriodEnd && (
            <button
              onClick={cancelSubscription}
              disabled={actionLoading}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel at period end
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 ${
                isCurrent ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{plan.audience}</p>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    Active
                  </span>
                )}
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                ₹{Number(plan.price).toLocaleString('en-IN')}
                <span className="text-sm font-medium text-slate-500"> / {plan.interval}</span>
              </p>

              {plan.description && <p className="mt-2 text-sm text-slate-600">{plan.description}</p>}

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>
                  Listings: <strong>{plan.maxListings <= 0 ? 'Unlimited' : plan.maxListings}</strong>
                </p>
                <p>
                  Contact reveals: <strong>{plan.maxContactReveals <= 0 ? 'Unlimited' : plan.maxContactReveals}</strong>
                </p>
                <p>
                  Bookings/month: <strong>{plan.maxBookingsPerMonth <= 0 ? 'Unlimited' : plan.maxBookingsPerMonth}</strong>
                </p>
              </div>

              <button
                onClick={() => subscribe(plan.id)}
                disabled={actionLoading || isCurrent}
                className={`mt-5 w-full rounded-lg px-3 py-2 text-sm font-semibold ${
                  isCurrent
                    ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-60`}
              >
                {isCurrent ? 'Current Plan' : 'Choose Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const cappedLimit = !limit || limit <= 0 ? null : limit;
  const ratio = cappedLimit ? Math.min(100, Math.round((used / cappedLimit) * 100)) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {used}
        <span className="text-sm font-medium text-slate-500">/{cappedLimit ?? '∞'}</span>
      </p>
      {cappedLimit && (
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full ${ratio >= 90 ? 'bg-red-500' : ratio >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${ratio}%` }}
          />
        </div>
      )}
    </div>
  );
}
