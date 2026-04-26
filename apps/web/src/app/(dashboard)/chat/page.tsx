'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const initAttemptedRef = useRef(false);
  const { conversations, loading, error, getOrCreateConversation } = useChat();
  const [search, setSearch] = useState('');
  const [initError, setInitError] = useState<string | null>(null);
  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    if (!listingId || initAttemptedRef.current) {
      return;
    }

    initAttemptedRef.current = true;
    setInitError(null);

    getOrCreateConversation(listingId)
      .then((conversation) => {
        router.replace(`/chat/${conversation.id}`);
      })
      .catch((err: any) => {
        setInitError(err?.message || 'Unable to start chat for this listing');
      });
  }, [listingId, getOrCreateConversation, router]);

  const filteredConversations = conversations.filter((c) =>
    (c.participantName || '').toLowerCase().includes(normalizedSearch) ||
    (c.listingTitle || '').toLowerCase().includes(normalizedSearch)
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">
          {conversations.length === 0 ? 'No conversations yet' : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {initError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {initError}
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-lg" />
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              {search ? 'No conversations match your search' : 'No conversations yet. Start chatting!'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className="group block rounded-lg border border-slate-200 px-4 py-3 transition-all hover:border-primary-300 hover:bg-primary-50"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Participant Info */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white">
                      {conversation.participantName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">
                        {conversation.participantName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {conversation.listingTitle}
                      </p>
                    </div>
                  </div>

                  {/* Last Message */}
                  <p className="text-sm text-slate-600 line-clamp-1 ml-13">
                    {conversation.lastMessage}
                  </p>
                </div>

                {/* Right Side */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <time className="text-xs text-slate-400">
                    {formatTime(new Date(conversation.lastMessageAt))}
                  </time>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-xs font-bold text-white">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
