'use client';

// This page renders only the CENTER chat pane + RIGHT CRM panel.
// The LEFT conversation rail lives in ../layout.tsx (never unmounts).

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/auth.store';
import { socketManager } from '@/lib/socket';
import api from '@/lib/api';

interface ChatDetailPageProps {
  params: {
    id: string;
  };
}

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  const conversationId = params.id;
  const { user } = useAuthStore();
  const { conversations, fetchMessages, sendMessage, fetchConversationById } = useChat();
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingActive, setTypingActive] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [statusValue, setStatusValue] = useState('NEW');
  const [statusNote, setStatusNote] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [showCrm, setShowCrm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [conversationDetail, setConversationDetail] = useState<any | null>(null);

  const conversation =
    conversations.find((c) => c.id === conversationId) || conversationDetail;

  const canManageInquiry = Boolean(
    conversation?.inquiry?.id &&
      (conversation?.ownerId === user?.id ||
        ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'AGENCY_ADMIN'].includes(user?.role || '')),
  );

  useEffect(() => {
    let active = true;

    const fromList = conversations.find((item) => item.id === conversationId);
    if (fromList) {
      setConversationDetail(fromList);
      setStatusValue(fromList.inquiry?.status || 'NEW');
      setConversationLoading(false);
      return;
    }

    setConversationLoading(true);
    setPageError('');

    fetchConversationById(conversationId)
      .then((result) => {
        if (!active) return;
        setConversationDetail(result);
        setStatusValue(result.inquiry?.status || 'NEW');
      })
      .catch((err: any) => {
        if (!active) return;
        setPageError(err?.message || 'Failed to load conversation details');
      })
      .finally(() => {
        if (active) {
          setConversationLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [conversationId, conversations, fetchConversationById]);

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
        setMessagesLoading(true);
        setPageError('');
        const result = await fetchMessages(conversationId);
        if (active) {
          setMessages(result.messages || []);
        }
      } catch (err: any) {
        if (active) {
          setPageError(err?.message || 'Failed to load messages');
        }
      } finally {
        if (active) {
          setMessagesLoading(false);
        }
      }
    };

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setMessagesLoading(false);
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
          setMessagesLoading(false);
        }
      });

    return () => {
      active = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socketManager.isConnected()) {
        socketManager.leaveRoom(conversationId);
      }
    };
  }, [conversationId, fetchMessages]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data?.conversationId === conversationId) {
        setTypingActive(false);
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

    const handleTypingUpdate = (data: any) => {
      if (!data || data.conversationId !== conversationId || data.userId === user?.id) {
        return;
      }
      setTypingActive(Boolean(data.isTyping));
    };

    socketManager.onNewMessage(handleNewMessage);
    socketManager.onTyping(handleTypingUpdate);

    return () => {
      const socket = socketManager.getSocket();
      if (socket) {
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing');
        socket.off('user_stop_typing');
      }
    };
  }, [conversationId, user?.id]);

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
      setPageError('');
      const tempMessage = sendMessage(conversationId, messageText.trim());
      setMessages((prev) => [...prev, tempMessage]);
      setMessageText('');
    } catch (err: any) {
      setPageError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateInquiryStatus = async () => {
    if (!conversation?.inquiry?.id || !canManageInquiry || statusUpdating) return;

    setStatusUpdating(true);
    setPageError('');
    try {
      await api.patch(`/inquiries/${conversation.inquiry.id}/status`, {
        status: statusValue,
        note: statusNote.trim() || undefined,
      });

      setConversationDetail((prev: any) => {
        if (!prev?.inquiry) return prev;
        return {
          ...prev,
          inquiry: {
            ...prev.inquiry,
            status: statusValue,
          },
        };
      });
      setStatusNote('');
    } catch (err: any) {
      setPageError(err?.response?.data?.message || err?.message || 'Failed to update inquiry status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const addInquiryNote = async () => {
    if (!conversation?.inquiry?.id || !canManageInquiry || !quickNote.trim() || noteSaving) return;

    setNoteSaving(true);
    setPageError('');
    try {
      await api.post(`/inquiries/${conversation.inquiry.id}/notes`, {
        note: quickNote.trim(),
      });
      setQuickNote('');
    } catch (err: any) {
      setPageError(err?.response?.data?.message || err?.message || 'Failed to add inquiry note');
    } finally {
      setNoteSaving(false);
    }
  };

  if (!conversation) {
    if (conversationLoading) {
      return (
        <div className="flex flex-1 items-center justify-center bg-white">
          <div className="text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
            <p className="mt-2 text-sm text-slate-400">Loading…</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white text-center">
        <p className="text-sm text-slate-500">Conversation not found.</p>
        {pageError && <p className="mt-2 text-sm text-red-600">{pageError}</p>}
        <Link href="/chat" className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Back to conversations
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ── CENTER: chat pane ── clean white, distinct chat bubbles ── */}
      <section className="flex min-w-0 flex-1 flex-col bg-white">
        {/* Chat header */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-3 shadow-sm sm:gap-3 sm:px-5">
          {/* Back to list — mobile only */}
          <Link
            href="/chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 sm:hidden"
            aria-label="Back to conversations"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {(conversation.participantName || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{conversation.participantName}</p>
            <p className="truncate text-xs text-slate-400">{conversation.listingTitle}</p>
          </div>
          {conversation.inquiry?.id && (
            <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ${statusClass(conversation.inquiry.status)}`}>
              {conversation.inquiry.status.replace(/_/g, ' ')}
            </span>
          )}
          {/* CRM panel toggle — hidden on lg where CRM is always shown */}
          <button
            onClick={() => setShowCrm((v) => !v)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors lg:hidden ${
              showCrm ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
            aria-label="Toggle details panel"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {pageError && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-600">{pageError}</div>
        )}

        {/* Messages area — soft grey background for contrast with white bubbles */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-5 sm:py-5">
          {messagesLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className="h-10 w-44 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const own = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75vw] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-sm ${
                      own
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="img" className="mb-2 max-w-xs rounded-xl" />
                    )}
                    <p className="leading-relaxed">{msg.message || msg.content}</p>
                    <p className={`mt-1 text-right text-[11px] ${own ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {typingActive && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-400 shadow-sm">
                {conversation.participantName} is typing…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Send input — white, separated from message area */}
        <div className="border-t border-slate-100 bg-white px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Type a message…"
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
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
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
      </section>

      {/* ── RIGHT: CRM actions panel ── */}

      {/* Desktop (lg+): always-visible side panel */}
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-indigo-100 bg-indigo-50/50 lg:flex">
        <CrmContent
          conversation={conversation}
          canManageInquiry={canManageInquiry}
          statusValue={statusValue}
          setStatusValue={setStatusValue}
          statusNote={statusNote}
          setStatusNote={setStatusNote}
          quickNote={quickNote}
          setQuickNote={setQuickNote}
          statusUpdating={statusUpdating}
          noteSaving={noteSaving}
          onUpdateStatus={updateInquiryStatus}
          onAddNote={addInquiryNote}
        />
      </aside>

      {/* Mobile / Tablet (< lg): bottom-sheet modal */}
      {showCrm && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowCrm(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Conversation Details</h3>
              <button
                onClick={() => setShowCrm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto bg-indigo-50/30">
              <CrmContent
                conversation={conversation}
                canManageInquiry={canManageInquiry}
                statusValue={statusValue}
                setStatusValue={setStatusValue}
                statusNote={statusNote}
                setStatusNote={setStatusNote}
                quickNote={quickNote}
                setQuickNote={setQuickNote}
                statusUpdating={statusUpdating}
                noteSaving={noteSaving}
                onUpdateStatus={updateInquiryStatus}
                onAddNote={addInquiryNote}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CrmContent({
  conversation,
  canManageInquiry,
  statusValue,
  setStatusValue,
  statusNote,
  setStatusNote,
  quickNote,
  setQuickNote,
  statusUpdating,
  noteSaving,
  onUpdateStatus,
  onAddNote,
}: {
  conversation: any;
  canManageInquiry: boolean;
  statusValue: string;
  setStatusValue: (v: string) => void;
  statusNote: string;
  setStatusNote: (v: string) => void;
  quickNote: string;
  setQuickNote: (v: string) => void;
  statusUpdating: boolean;
  noteSaving: boolean;
  onUpdateStatus: () => void;
  onAddNote: () => void;
}) {
  return (
    <div className="space-y-4 p-4">
      {/* Inquiry context card */}
      <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Inquiry Context</p>
        {conversation.inquiry?.id ? (
          <>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              #{conversation.inquiry.id.slice(0, 8)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Source: {conversation.inquiry.source || 'listing_page'}
            </p>
            {conversation.inquiry.message && (
              <p className="mt-2 line-clamp-3 text-xs text-slate-600">
                {conversation.inquiry.message}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/inquiries/${conversation.inquiry.id}`}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                View Inquiry
              </Link>
              {conversation.listingId && (
                <Link
                  href={`/listings/${conversation.listingId}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  View Listing
                </Link>
              )}
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs text-slate-400">No inquiry linked yet.</p>
        )}
      </div>

      {/* Manage inquiry — only visible to owner / admin */}
      {canManageInquiry && (
        <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Manage Inquiry</p>

          <label className="mt-3 block text-xs font-semibold text-slate-600">Status</label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          >
            {['NEW', 'CONTACTED', 'NEGOTIATING', 'VISIT_SCHEDULED', 'CONVERTED', 'LOST', 'CLOSED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <label className="mt-3 block text-xs font-semibold text-slate-600">Status note</label>
          <textarea
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            rows={2}
            placeholder="Optional context…"
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          />
          <button
            onClick={onUpdateStatus}
            disabled={statusUpdating}
            className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {statusUpdating ? 'Updating…' : 'Update Status'}
          </button>

          <div className="my-3 border-t border-slate-100" />

          <label className="block text-xs font-semibold text-slate-600">Internal note</label>
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            rows={2}
            placeholder="Add to inquiry timeline…"
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          />
          <button
            onClick={onAddNote}
            disabled={noteSaving || !quickNote.trim()}
            className="mt-2 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {noteSaving ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      )}
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case 'NEW':              return 'bg-blue-100 text-blue-700';
    case 'CONTACTED':        return 'bg-indigo-100 text-indigo-700';
    case 'NEGOTIATING':      return 'bg-violet-100 text-violet-700';
    case 'VISIT_SCHEDULED':  return 'bg-amber-100 text-amber-700';
    case 'CONVERTED':        return 'bg-emerald-100 text-emerald-700';
    case 'LOST':             return 'bg-red-100 text-red-700';
    case 'CLOSED':           return 'bg-slate-200 text-slate-700';
    default:                 return 'bg-slate-100 text-slate-700';
  }
}
