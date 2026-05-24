'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ChatToast } from '@/hooks/useChat';

interface Props {
  toasts: ChatToast[];
  onDismiss: (toastId: string) => void;
}

function ToastChip({ toast, onDismiss }: { toast: ChatToast; onDismiss: () => void }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const initials = toast.senderName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  function handleClick() {
    onDismiss();
    router.push(`/chat/${toast.conversationId}`);
  }

  return (
    <div
      className={`relative flex max-w-[220px] cursor-pointer items-center gap-2.5 rounded-2xl rounded-tr-md bg-slate-900 px-3 py-2.5 shadow-xl transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
      onClick={handleClick}
      role="button"
      aria-label={`Message from ${toast.senderName}`}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden rounded-b-2xl">
        <div className="h-full animate-shrink bg-indigo-400 opacity-60" />
      </div>

      {/* Avatar */}
      {toast.avatar ? (
        <img
          src={toast.avatar}
          alt={toast.senderName}
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
          {initials || '?'}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white">{toast.senderName}</p>
        <p className="truncate text-[11px] text-slate-400">{toast.message}</p>
      </div>
    </div>
  );
}

export default function MessageToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-20 z-[9999] flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div key={toast.toastId} className="pointer-events-auto">
          <ToastChip toast={toast} onDismiss={() => onDismiss(toast.toastId)} />
        </div>
      ))}
    </div>
  );
}
