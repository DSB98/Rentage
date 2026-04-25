// Notification job payloads consumed by the BullMQ processor.

export type NotificationJob =
  | { kind: 'email'; to: string; subject: string; html: string; text?: string }
  | { kind: 'sms'; to: string; body: string; templateId?: string; vars?: Record<string, string> }
  | {
      kind: 'whatsapp';
      to: string;
      body: string;
      templateId?: string;
      templateParams?: string[];
      mediaUrl?: string;
    }
  | {
      kind: 'push';
      userId: string;
      title: string;
      body: string;
      data?: Record<string, string>;
      imageUrl?: string;
    }
  | {
      kind: 'multi';
      userId: string;
      category: string; // notification category for preference lookup
      title: string;
      body: string;
      data?: Record<string, any>;
      url?: string;
      imageUrl?: string;
      channels?: Array<'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP'>;
    };

export const NOTIFICATIONS_QUEUE = 'notifications';
