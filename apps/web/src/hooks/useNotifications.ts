import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: Notification[];
  meta?: {
    cursor?: string;
    hasMore?: boolean;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (!reset && cursor) {
          params.append('cursor', cursor);
        }
        params.append('limit', '20');

        const { data } = await api.get<NotificationsResponse>(
          `/notifications?${params.toString()}`
        );

        if (reset) {
          setNotifications(data.items);
        } else {
          setNotifications((prev) => [...prev, ...data.items]);
        }

        const nextCursor = data.meta?.cursor;
        setCursor(nextCursor);
        setHasMore(data.meta?.hasMore ?? true);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    },
    [cursor]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNotifications(false);
  }, [hasMore, loading, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(true);
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh: () => fetchNotifications(true),
  };
}
