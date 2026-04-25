'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, loadUser } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      loadUser().then(() => {
        router.push('/dashboard');
      });
    } else {
      router.push('/login');
    }
  }, [searchParams, setTokens, loadUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  );
}
