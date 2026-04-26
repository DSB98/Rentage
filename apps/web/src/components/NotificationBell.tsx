'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current) {
        const target = event.target as HTMLElement;
        if (!dropdownRef.current.contains(target)) {
          setOpen(false);
        }
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2.5 text-surface-400 transition-colors hover:bg-surface-50 hover:text-slate-900"
        title="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31M5 19.5A2.5 2.5 0 017.5 22h9a2.5 2.5 0 012.5-2.5M5 19.5a2.5 2.5 0 01-2.5-2.5m15 0a2.5 2.5 0 01-2.5 2.5m0 0V12a6 6 0 11-12 0v7.5"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-96 animate-scale-in rounded-2xl border border-surface-200/60 bg-white shadow-elevated">
            {/* Header */}
            <div className="border-b border-surface-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                <Link
                  href="/notifications"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => setOpen(false)}
                >
                  View all →
                </Link>
              </div>
            </div>

            {/* Notifications List */}
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-96 divide-y divide-surface-100 overflow-y-auto">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50 ${
                      !notification.isRead ? 'bg-primary-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                          notification.isRead ? 'bg-slate-300' : 'bg-primary-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatTime(new Date(notification.createdAt))}
                        </p>
                      </div>
                      {notification.data?.link && (
                        <Link
                          href={notification.data.link}
                          className="flex-shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                          }}
                        >
                          →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="border-t border-surface-100 px-4 py-2 text-center">
                <Link
                  href="/notifications"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => setOpen(false)}
                >
                  See all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
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

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
