'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/auth.store';
import { socketManager } from '@/lib/socket';

interface ChatDetailPageProps {
  params: {
    id: string;
  };
}

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  const conversationId = params.id;
  const { user } = useAuthStore();
  const { conversations, fetchMessages, sendMessage } = useChat();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const conversation = conversations.find((c) => c.id === conversationId);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages on mount
  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const result = await fetchMessages(conversationId);
        if (active) {
          setMessages(result.messages || []);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    socketManager
      .connect(token)
      .then(() => {
        socketManager.joinRoom(conversationId);
        return loadMessages();
      })
      .catch((err) => {
        console.error('Failed to connect chat room:', err);
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.leaveRoom(conversationId);
    };
  }, [conversationId, fetchMessages]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data?.conversationId === conversationId) {
        setMessages((prev) => {
          const nextMessage = {
            id: data.id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            message: data.content,
            imageUrl: data.imageUrl,
            isRead: data.isRead,
            createdAt: data.createdAt,
          };

          const filtered = prev.filter(
            (message) =>
              !(message.id?.startsWith?.('temp-') &&
                message.senderId === nextMessage.senderId &&
                (message.message || message.content) === nextMessage.message),
          );

          if (filtered.some((message) => message.id === nextMessage.id)) {
            return filtered;
          }

          return [...filtered, nextMessage];
        });
      }
    };

    socketManager.onNewMessage(handleNewMessage);

    return () => {
      if (socketManager.getSocket()) {
        socketManager.getSocket()?.off('new_message', handleNewMessage);
      }
    };
  }, [conversationId]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socketManager.isConnected()) {
      return;
    }

    socketManager.sendTypingIndicator(conversationId, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTypingIndicator(conversationId, false);
    }, 3000);
  }, [conversationId]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const tempMessage = sendMessage(conversationId, messageText.trim());
      setMessages((prev) => [...prev, tempMessage]);
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <p className="text-sm text-slate-500">Conversation not found</p>
        <Link href="/chat" className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
          Back to conversations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-primary-600 hover:text-primary-700 md:hidden">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white">
            {conversation.participantName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{conversation.participantName}</p>
            <p className="text-xs text-slate-500">{conversation.listingTitle}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Message"
                      className="mb-2 max-w-xs rounded-lg"
                    />
                  )}
                  <p className="text-sm">{message.message || message.content}</p>
                  <p className={`mt-1 text-xs ${isOwnMessage ? 'text-primary-100' : 'text-slate-500'}`}>
                    {formatTime(new Date(message.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 px-4 py-4 sm:px-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !messageText.trim()}
            className="flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-700 disabled:bg-slate-200"
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125a.75.75 0 0 1 1.06-.877L20.5 11.25a.75.75 0 0 1 0 1.5L4.33 21.752a.75.75 0 0 1-1.06-.877L6 12Zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
