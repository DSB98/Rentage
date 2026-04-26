'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const displayNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2">
        {displayNotifications.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          displayNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id, notification.isRead)}
              className={`cursor-pointer rounded-lg border px-4 py-4 transition-colors ${
                notification.isRead
                  ? 'border-slate-200 bg-white hover:bg-slate-50'
                  : 'border-primary-200 bg-primary-50 hover:bg-primary-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="inline-block h-2 w-2 rounded-full bg-primary-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {notification.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <time className="text-xs text-slate-400">
                    {formatTime(new Date(notification.createdAt))}
                  </time>
                  {notification.data?.link && (
                    <Link
                      href={notification.data.link}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && displayNotifications.length > 0 && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-6 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
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
