'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';

type ProfileForm = {
  fullName: string;
  phone: string;
  bio: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gender: string;
  dob: string;
  avatarUrl: string;
};

type KycDoc = {
  id: string;
  type: string;
};

type KycSubmission = {
  id: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  rejectReason?: string;
  documents?: KycDoc[];
};

const KYC_STATUS_CLASS: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  IN_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  EXPIRED: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [kyc, setKyc] = useState<KycSubmission | null>(null);
  const [kycLoading, setKycLoading] = useState(true);

  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    country: 'IN',
    pincode: '',
    gender: '',
    dob: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (!user) return;

    const dobValue = user.profile?.dob ? new Date(user.profile.dob).toISOString().slice(0, 10) : '';
    setForm({
      fullName: user.profile?.fullName || '',
      phone: user.profile?.phone || '',
      bio: user.profile?.bio || '',
      city: user.profile?.city || '',
      state: user.profile?.state || '',
      country: user.profile?.country || 'IN',
      pincode: user.profile?.pincode || '',
      gender: user.profile?.gender || '',
      dob: dobValue,
      avatarUrl: user.profile?.avatarUrl || '',
    });
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setKycLoading(true);
      try {
        const { data } = await api.get<KycSubmission | null>('/kyc/me');
        if (mounted) setKyc(data);
      } catch {
        if (mounted) setKyc(null);
      } finally {
        if (mounted) setKycLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const profileCompletion = useMemo(() => {
    const checks = [
      !!form.fullName.trim(),
      !!form.phone.trim(),
      !!form.bio.trim(),
      !!form.city.trim(),
      !!form.state.trim(),
      !!form.country.trim(),
      !!form.pincode.trim(),
      !!form.gender.trim(),
      !!form.dob,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [form]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/user/profile', {
        ...form,
        pincode: form.pincode.trim(),
        phone: form.phone.trim(),
        dob: form.dob ? new Date(form.dob).toISOString() : null,
      });
      await loadUser();
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const displayName = form.fullName || user?.email || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const kycStatus = kyc?.status || 'NOT_SUBMITTED';
  const kycClass = KYC_STATUS_CLASS[kycStatus] || 'bg-slate-100 text-slate-700 border-slate-200';
  const isEmailVerified = !!user?.isEmailVerified;
  const isPhoneVerified = !!(user as any)?.isPhoneVerified;
  const docsCount = kyc?.documents?.length || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-36 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-sky-100 text-3xl font-bold text-sky-700">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  avatarInitial
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{user?.role}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Profile {profileCompletion}% complete</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setError('');
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm text-slate-700">{form.bio || 'Add a short bio to make your profile stand out and improve trust.'}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Full Name" value={form.fullName} onChange={(v) => updateField('fullName', v)} editing={editing} />
              <InputField label="Phone" value={form.phone} onChange={(v) => updateField('phone', v)} editing={editing} />
              <InputField label="City" value={form.city} onChange={(v) => updateField('city', v)} editing={editing} />
              <InputField label="State" value={form.state} onChange={(v) => updateField('state', v)} editing={editing} />
              <InputField label="Country" value={form.country} onChange={(v) => updateField('country', v)} editing={editing} />
              <InputField label="Pincode" value={form.pincode} onChange={(v) => updateField('pincode', v.replace(/\D/g, '').slice(0, 6))} editing={editing} />
              <InputField label="Gender" value={form.gender} onChange={(v) => updateField('gender', v)} editing={editing} />
              <InputField label="Date of Birth" type="date" value={form.dob} onChange={(v) => updateField('dob', v)} editing={editing} />
              <InputField label="Avatar URL" value={form.avatarUrl} onChange={(v) => updateField('avatarUrl', v)} editing={editing} className="sm:col-span-2" />
              <TextAreaField label="Bio" value={form.bio} onChange={(v) => updateField('bio', v)} editing={editing} className="sm:col-span-2" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Verification Center</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <VerificationRow label="Email Verification" value={isEmailVerified ? 'Verified' : 'Not verified'} verified={isEmailVerified} />
              <VerificationRow label="Phone Verification" value={isPhoneVerified ? 'Verified' : 'Not verified'} verified={isPhoneVerified} />
              <VerificationRow label="Account Status" value={user?.isActive ? 'Active' : 'Inactive'} verified={!!user?.isActive} />
              <VerificationRow label="KYC Status" value={kycStatus.replace('_', ' ')} verified={kycStatus === 'APPROVED'} />
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">KYC Verification</h3>
            {kycLoading ? (
              <p className="mt-3 text-sm text-slate-500">Loading KYC status...</p>
            ) : (
              <>
                <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${kycClass}`}>
                  {kycStatus === 'NOT_SUBMITTED' ? 'Not Submitted' : kycStatus.replace('_', ' ')}
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-medium">Documents:</span> {docsCount}
                  </p>
                  <p>
                    <span className="font-medium">Submitted:</span>{' '}
                    {kyc?.createdAt ? new Date(kyc.createdAt).toLocaleDateString('en-IN') : '—'}
                  </p>
                  <p>
                    <span className="font-medium">Reviewed:</span>{' '}
                    {kyc?.reviewedAt ? new Date(kyc.reviewedAt).toLocaleDateString('en-IN') : '—'}
                  </p>
                </div>

                {kyc?.rejectReason && (
                  <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    <span className="font-semibold">Reason:</span> {kyc.rejectReason}
                  </div>
                )}
              </>
            )}

            <Link href="/kyc" className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
              {kycStatus === 'APPROVED' ? 'View KYC Details' : 'Manage KYC'}
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile Score</h3>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-sky-600" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-600">Complete profile + approved KYC boosts trust and inquiry conversions.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  editing,
  type = 'text',
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      ) : (
        <p className="mt-2 text-sm font-medium text-slate-900">{value || '—'}</p>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  editing,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={500}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      ) : (
        <p className="mt-2 text-sm font-medium text-slate-900">{value || '—'}</p>
      )}
    </div>
  );
}

function VerificationRow({ label, value, verified }: { label: string; value: string; verified: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
        {value}
      </span>
    </div>
  );
}
