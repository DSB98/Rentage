import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

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
  listingTitle: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ApiConversation {
  id: string;
  listingId: string;
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
}

function normalizeConversation(conversation: ApiConversation): Conversation {
  return {
    id: conversation.id,
    listingId: conversation.listingId,
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

  // Send message (local optimistic update + socket emit)
  const sendMessage = useCallback(
    (conversationId: string, message: string, imageUrl?: string) => {
      try {
        if (!user?.id) throw new Error('Not authenticated');

        // Optimistic update
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId,
          senderId: user.id,
          senderName: user.profile?.fullName || 'You',
          message,
          imageUrl,
          isRead: true,
          createdAt: new Date().toISOString(),
        };

        const existing = messagesRef.current.get(conversationId) || [];
        messagesRef.current.set(conversationId, [...existing, tempMessage]);

        // Emit via socket
        socketManager.sendMessage(conversationId, message, imageUrl);

        // Update conversation last message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: message, lastMessageAt: new Date().toISOString() }
              : c
          )
        );

        return tempMessage;
      } catch (err) {
        console.error('Failed to send message:', err);
        throw err;
      }
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

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: msg.message || conversation.lastMessage,
                lastMessageAt: msg.createdAt || conversation.lastMessageAt,
                unreadCount:
                  msg.senderId === user?.id ? conversation.unreadCount : conversation.unreadCount + 1,
              }
            : conversation,
        ),
      );
    };

    const handleTyping = (data: any) => {
      console.log('User typing:', data);
      // Handle typing indicator UI update here
    };

    socketManager.onNewMessage(handleNewMessage);
    socketManager.onTyping(handleTyping);

    // Fetch initial conversations
    fetchConversations();

    return () => {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.off('new_message', handleNewMessage);
        socket.off('typing', handleTyping);
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
    getOrCreateConversation,
    fetchMessages,
    sendMessage,
    getMessagesForConversation,
    isSocketConnected: socketManager.isConnected(),
  };
}
