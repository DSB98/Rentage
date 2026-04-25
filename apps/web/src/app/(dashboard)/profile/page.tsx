'use client';

import { useAuthStore } from '@/stores/auth.store';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <div className="mt-6 max-w-lg rounded-xl border bg-white p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-gray-900">{user?.profile?.fullName || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-gray-900">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Role</label>
            <p className="mt-1 text-gray-900">{user?.role || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
