// Communication provider abstractions
// Each adapter implements one of these so providers can be swapped via DI.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

export interface SmsMessage {
  to: string; // E.164 phone number
  body: string;
  templateId?: string;
  vars?: Record<string, string>;
}

export interface WhatsappMessage {
  to: string; // E.164 phone number
  body: string;
  templateId?: string;
  templateParams?: string[];
  mediaUrl?: string;
}

export interface PushMessage {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface ProviderResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');
export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');

export interface EmailProvider {
  send(msg: EmailMessage): Promise<ProviderResult>;
}

export interface SmsProvider {
  send(msg: SmsMessage): Promise<ProviderResult>;
}

export interface WhatsappAdapter {
  send(msg: WhatsappMessage): Promise<ProviderResult>;
}

export interface PushProvider {
  send(msg: PushMessage): Promise<ProviderResult & { invalidTokens?: string[] }>;
}
