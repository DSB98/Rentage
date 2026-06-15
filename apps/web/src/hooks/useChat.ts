import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

// Module-level dedup — prevents multiple useChat() instances from creating duplicate toasts
const toastedMessageIds = new Set<string>();

// Singleton AudioContext — reused across all calls; unlocked on first user interaction
let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    if (!_audioCtx) _audioCtx = new Ctor() as AudioContext;
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}

function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // silently fail if audio is blocked
  }
}

export interface ChatToast {
  toastId: string;
  conversationId: string;
  senderName: string;
  avatar?: string;
  message: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string | null;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  listingId: string;
  ownerId?: string;
  renterId?: string;
  listingTitle: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  inquiry?: {
    id: string;
    status: string;
    source?: string | null;
    message?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    preferredAt?: string | null;
    createdAt?: string;
  } | null;
}

interface ApiConversation {
  id: string;
  listingId: string;
  ownerId?: string;
  renterId?: string;
  listing?: { id: string; title?: string | null } | null;
  otherUser?: {
    id: string;
    profile?: { fullName?: string | null; avatarUrl?: string | null } | null;
  } | null;
  lastMessage?: {
    id: string;
    content?: string | null;
    createdAt?: string;
  } | null;
  lastMessageAt?: string | null;
  unreadCount?: number | null;
  inquiry?: {
    id: string;
    status: string;
    source?: string | null;
    message?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    preferredAt?: string | null;
    createdAt?: string;
  } | null;
}

function normalizeConversation(conversation: ApiConversation): Conversation {
  return {
    id: conversation.id,
    listingId: conversation.listingId,
    ownerId: conversation.ownerId,
    renterId: conversation.renterId,
    listingTitle: conversation.listing?.title?.trim() || 'Untitled listing',
    participantId: conversation.otherUser?.id || '',
    participantName: conversation.otherUser?.profile?.fullName?.trim() || 'Unknown user',
    participantAvatar: conversation.otherUser?.profile?.avatarUrl || undefined,
    lastMessage: conversation.lastMessage?.content?.trim() || 'No messages yet',
    lastMessageAt:
      conversation.lastMessageAt ||
      conversation.lastMessage?.createdAt ||
      new Date(0).toISOString(),
    unreadCount: conversation.unreadCount ?? 0,
    inquiry: conversation.inquiry || null,
  };
}

function normalizeMessage(message: ApiMessage, currentUserName?: string): Message {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName: currentUserName || 'User',
    message: message.content?.trim() || '',
    imageUrl: message.imageUrl || undefined,
    isRead: message.isRead,
    createdAt: message.createdAt,
  };
}

export function useChat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<Map<string, Message[]>>(new Map());

  // Refs for access inside event handler closures
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const conversationsRef = useRef<Conversation[]>([]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // In-app notification toasts
  const [toasts, setToasts] = useState<ChatToast[]>([]);
  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  // Pre-warm AudioContext on first user gesture so sound plays instantly on notification
  useEffect(() => {
    const unlock = () => getAudioContext();
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // When navigating to a conversation page, immediately zero out its unread count
  // in local state — no server round-trip needed (user is looking at it).
  useEffect(() => {
    const match = pathname?.match(/^\/chat\/([^/]+)$/);
    if (match) {
      const conversationId = match[1];
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    }
  }, [pathname]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<ApiConversation[]>('/chat/conversations');
      setConversations((data || []).map(normalizeConversation));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get or create conversation
  const getOrCreateConversation = useCallback(async (listingId: string) => {
    try {
      const { data } = await api.post<ApiConversation>('/chat/conversations', {
        listingId,
      });
      return normalizeConversation(data);
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to create conversation');
    }
  }, []);

  const fetchConversationById = useCallback(async (conversationId: string) => {
    try {
      const { data } = await api.get<ApiConversation>(`/chat/conversations/${conversationId}`);
      const normalized = normalizeConversation(data);
      setConversations((prev) => {
        const existing = prev.find((item) => item.id === normalized.id);
        if (existing) {
          return prev.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item));
        }
        return [normalized, ...prev];
      });
      return normalized;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to fetch conversation');
    }
  }, []);

  // Fetch messages for conversation
  const fetchMessages = useCallback(async (conversationId: string, cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '50');

      const { data } = await api.get<{
        items: ApiMessage[];
        meta?: { cursor?: string; hasMore?: boolean };
      }>(`/chat/conversations/${conversationId}/messages?${params.toString()}`);

      const existing = messagesRef.current.get(conversationId) || [];
      const normalizedItems = (data.items || []).map((item) =>
        normalizeMessage(item, item.senderId === user?.id ? user.profile?.fullName || 'You' : undefined),
      );
      const newMessages = cursor ? [...normalizedItems, ...existing] : normalizedItems;
      messagesRef.current.set(conversationId, newMessages);

      return { messages: newMessages, hasMore: data.meta?.hasMore ?? false, cursor: data.meta?.cursor };
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Failed to fetch messages');
    }
  }, [user?.id, user?.profile?.fullName]);

  // Send message — REST API (authoritative) + optional socket emit for real-time delivery
  const sendMessage = useCallback(
    async (conversationId: string, message: string, imageUrl?: string): Promise<Message> => {
      if (!user?.id) throw new Error('Not authenticated');

      // Persist to DB via REST
      const { data } = await api.post(
        `/chat/conversations/${conversationId}/messages`,
        { content: message, imageUrl },
      );
      const saved: ApiMessage = data.data ?? data;
      const confirmedMessage = normalizeMessage(saved, user.profile?.fullName || 'You');

      // Keep the ref cache aligned with the saved message returned by the API
      const existing = messagesRef.current.get(conversationId) || [];
      messagesRef.current.set(
        conversationId,
        existing.filter((m) => m.id !== confirmedMessage.id).concat(confirmedMessage),
      );

      // Update conversation last message in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: message, lastMessageAt: new Date().toISOString() }
            : c
        )
      );

      // Also emit via socket if connected (delivers to other participant in real-time)
      if (socketManager.isConnected()) {
        socketManager.sendMessage(conversationId, message, imageUrl);
      }

      return confirmedMessage;
    },
    [user]
  );

  // Initialize socket connection and listeners
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Connect socket
    socketManager.connect(token).catch((err) => {
      console.error('Failed to connect socket:', err);
    });

    // Join conversation room and listen for new messages
    const handleNewMessage = (data: any) => {
      const conversationId = data?.conversationId;
      if (!conversationId) {
        return;
      }

      const msg = normalizeMessage(data, data.senderId === user?.id ? user.profile?.fullName || 'You' : undefined);
      const existing = messagesRef.current.get(conversationId) || [];
      const filtered = existing.filter(
        (m) => !(m.id.startsWith('temp-') && m.senderId === msg.senderId && m.message === msg.message),
      );
      messagesRef.current.set(conversationId, [...filtered, msg]);

      // In-app notification for messages from others
      if (msg.senderId !== user?.id && !toastedMessageIds.has(msg.id)) {
        const isViewingThisConversation = pathnameRef.current === `/chat/${conversationId}`;
        if (!isViewingThisConversation) {
          toastedMessageIds.add(msg.id);
          playNotificationSound();
          const conv = conversationsRef.current.find((c) => c.id === conversationId);
          const toastId = `toast-${msg.id}`;
          setToasts((prev) => {
            const capped = prev.length >= 4 ? prev.slice(1) : prev;
            return [
              ...capped,
              {
                toastId,
                conversationId,
                senderName: conv?.participantName || 'Someone',
                avatar: conv?.participantAvatar,
                message: msg.message || 'Sent a message',
              },
            ];
          });
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
            toastedMessageIds.delete(msg.id);
          }, 5000);
        }
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: msg.message || conversation.lastMessage,
                lastMessageAt: msg.createdAt || conversation.lastMessageAt,
                // Don't increment if: own message OR currently viewing this conversation
                unreadCount:
                  msg.senderId === user?.id || pathnameRef.current === `/chat/${conversationId}`
                    ? conversation.unreadCount
                    : conversation.unreadCount + 1,
              }
            : conversation,
        ),
      );
    };

    const handleTyping = (data: any) => {
      console.log('User typing:', data);
      // Handle typing indicator UI update here
    };

    const handleMessagesMarkedRead = (data: any) => {
      const conversationId = data?.conversationId;
      if (!conversationId) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
    };

    socketManager.onNewMessage(handleNewMessage);
    socketManager.onTyping(handleTyping);

    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('messages_marked_read', handleMessagesMarkedRead);
    }

    // Fetch initial conversations
    fetchConversations();

    return () => {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.off('new_message', handleNewMessage);
        socket.off('typing', handleTyping);
        socket.off('messages_marked_read', handleMessagesMarkedRead);
      }
    };
  }, [user?.id, user?.profile?.fullName, fetchConversations]);

  const getMessagesForConversation = useCallback((conversationId: string): Message[] => {
    return messagesRef.current.get(conversationId) || [];
  }, []);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    fetchConversationById,
    getOrCreateConversation,
    fetchMessages,
    sendMessage,
    getMessagesForConversation,
    isSocketConnected: socketManager.isConnected(),
    toasts,
    dismissToast,
  };
}
