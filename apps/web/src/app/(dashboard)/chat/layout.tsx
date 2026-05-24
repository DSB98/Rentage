'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id?: string }>();
  const activeId = params?.id as string | undefined;
  const { conversations, loading } = useChat();
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = conversations.filter((c) => {
    if (!normalizedSearch) return true;
    return (
      (c.participantName || '').toLowerCase().includes(normalizedSearch) ||
      (c.listingTitle || '').toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-9rem)] min-h-0 overflow-hidden sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-sm">
      {/* ── Left: dark conversation rail ── hidden on mobile when inside a chat ── */}
      <aside className={`${
        activeId ? 'hidden sm:flex' : 'flex w-full'
      } sm:w-72 shrink-0 flex-col bg-slate-900`}>
        <div className="border-b border-slate-700/60 px-3 py-3 sm:px-4 sm:py-4">
          <h2 className="text-base font-semibold text-white">Messages</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
          </p>
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 sm:p-2">
          {loading ? (
            <div className="space-y-1 p-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              {search ? 'No matches.' : 'No conversations yet.'}
            </p>
          ) : (
            filtered.map((item) => {
              const isActive = item.id === activeId;
              return (
                <Link
                  key={item.id}
                  href={`/chat/${item.id}`}
                  scroll={false}
                  className={`group mb-0.5 flex flex-col rounded-lg transition-all ${
                    isActive
                      ? 'border-l-2 border-indigo-400 bg-white/[0.08] px-[10px] py-3'
                      : 'border-l-2 border-transparent px-[10px] py-3 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isActive ? 'bg-indigo-400/80 text-white' : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {(item.participantName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`truncate text-sm font-semibold leading-tight ${
                            isActive ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {item.participantName}
                        </p>
                        <span className={`shrink-0 text-[11px] ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                          {formatTime(new Date(item.lastMessageAt))}
                        </span>
                      </div>
                      <p className={`truncate text-xs ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                        {item.listingTitle}
                      </p>
                    </div>
                    {item.unreadCount > 0 && !isActive && (
                      <span className="ml-auto flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
                        {item.unreadCount > 9 ? '9+' : item.unreadCount}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1.5 line-clamp-1 pl-[2.625rem] text-xs ${
                    isActive ? 'text-indigo-200/90' : 'text-slate-400'
                    }`}
                  >
                    {item.lastMessage || 'No messages yet'}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Center + Right ── hidden on mobile when no conversation selected ── */}
      <div className={`${
        activeId ? 'flex' : 'hidden sm:flex'
      } min-w-0 flex-1 overflow-hidden`}>{children}</div>
    </div>
  );
}

function formatTime(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}
