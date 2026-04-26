import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface KycSubmission {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  facePhotoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export function useKyc() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current KYC status
  const getKycStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<KycSubmission>('/kyc/me');
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to fetch KYC status';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // List my KYC submissions
  const listMySubmissions = useCallback(async (cursor?: string, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', limit.toString());

      const { data } = await api.get<{
        items: KycSubmission[];
        meta?: { cursor?: string; hasMore?: boolean };
      }>(`/kyc/my-submissions?${params.toString()}`);

      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to fetch submissions';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit KYC documents
  const submitKyc = useCallback(
    async (documentType: string, documentUrl: string, facePhotoUrl: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.post<KycSubmission>('/kyc/submissions', {
          documentType,
          documentUrl,
          facePhotoUrl,
        });

        return data;
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Failed to submit KYC';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getKycStatus,
    listMySubmissions,
    submitKyc,
  };
}
