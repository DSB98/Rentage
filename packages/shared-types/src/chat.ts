import { MessageType } from './enums';

export interface IConversation {
  id: string;
  listingId: string;
  ownerId: string;
  renterId: string;
  lastMessageAt?: string;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    images: { url: string }[];
  };
  otherUser?: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl?: string;
    } | null;
  };
  lastMessage?: IMessage;
  unreadCount?: number;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// Socket.io event payloads
export interface ISendMessagePayload {
  conversationId: string;
  content: string;
  messageType: MessageType;
  imageUrl?: string;
}

export interface ITypingPayload {
  conversationId: string;
}
