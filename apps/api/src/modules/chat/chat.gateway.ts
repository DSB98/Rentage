import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageType } from '@rentage/shared-types';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3100',
  'http://localhost:3111',
];

const LAN_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?$/i;

/** Resolved at connection time so env vars loaded by ConfigModule are visible. */
function getAllowedOrigins(): string[] {
  const extra = [process.env.ALLOWED_ORIGINS, process.env.APP_URL]
    .filter(Boolean)
    .flatMap((v) => v!.split(','))
    .map((o) => o.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra]));
}

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (getAllowedOrigins().includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && LAN_ORIGIN_RE.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      this.onlineUsers.set(payload.sub, client.id);

      // Join personal room so this client receives events without being in a conversation room
      client.join(`user:${payload.sub}`);

      // Broadcast online status
      this.server.emit('user_online', { userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user_offline', { userId });
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('Unauthenticated');

    await this.assertMember(data.conversationId, userId);

    client.join(`conversation:${data.conversationId}`);
    // Mark messages as read
    await this.chatService.markAsRead(data.conversationId, userId);
    // Tell this client to reset unread count for this conversation
    client.emit('messages_marked_read', { conversationId: data.conversationId });
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; messageType?: MessageType; imageUrl?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('Unauthenticated');

    await this.assertMember(data.conversationId, userId);

    const message = await this.chatService.sendMessage(
      data.conversationId,
      userId,
      data.content,
      data.messageType || MessageType.TEXT,
      data.imageUrl,
    );

    // Emit to conversation room (active participants)
    this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);

    // Also emit to the recipient's personal room so their sidebar unread count updates
    // even if they haven't opened the conversation.
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
      select: { ownerId: true, renterId: true },
    });
    if (conversation) {
      const recipientIds = [conversation.ownerId, conversation.renterId].filter(
        (id) => id && id !== userId,
      ) as string[];
      recipientIds.forEach((recipientId) => {
        // Use .except() so clients already in the conversation room don't receive
        // a second copy of the event (they already got it via the room emit above).
        this.server
          .to(`user:${recipientId}`)
          .except(`conversation:${data.conversationId}`)
          .emit('new_message', message);
      });
    }

    return message;
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_stop_typing', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('Unauthenticated');

    await this.assertMember(data.conversationId, userId);

    await this.chatService.markAsRead(data.conversationId, userId);
    this.server.to(`conversation:${data.conversationId}`).emit('message_read', {
      conversationId: data.conversationId,
      readBy: userId,
      readAt: new Date().toISOString(),
    });
    // Also tell this client directly in case they're not in the room yet
    client.emit('messages_marked_read', { conversationId: data.conversationId });
  }

  // ─── HELPERS ─────────────────────────────────────
  private async assertMember(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true, renterId: true },
    });
    if (!conv) throw new WsException('Conversation not found');
    if (conv.ownerId !== userId && conv.renterId !== userId) {
      throw new WsException('Forbidden: not a participant');
    }
  }
}
