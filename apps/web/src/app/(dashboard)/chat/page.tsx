'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';

// The conversation list is rendered in layout.tsx (persistent across navigation).
// This page only handles the ?listingId= redirect and shows a "select a conversation" state.
export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const initAttemptedRef = useRef(false);
  const { getOrCreateConversation } = useChat();

  useEffect(() => {
    if (!listingId || initAttemptedRef.current) return;
    initAttemptedRef.current = true;
    getOrCreateConversation(listingId)
      .then((conv) => router.replace(`/chat/${conv.id}`))
      .catch(() => {});
  }, [listingId, getOrCreateConversation, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
        <svg
          className="h-8 w-8 text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
      </div>
      <p className="text-base font-semibold text-slate-700">Select a conversation</p>
      <p className="mt-1 text-sm text-slate-400">Choose from the list on the left to start chatting.</p>
    </div>
  );
}

