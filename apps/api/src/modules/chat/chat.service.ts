import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageType } from '@rentage/shared-types';
import { InquiryService } from '../inquiry/inquiry.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private inquiryService: InquiryService,
  ) {}

  async getOrCreateConversation(listingId: string, renterId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId === renterId) {
      throw new BadRequestException('Cannot start chat on your own listing');
    }

    let conversation = await this.prisma.conversation.findUnique({
      where: { listingId_renterId: { listingId, renterId } },
      include: {
        listing: { select: { id: true, title: true, images: { take: 1 } } },
        owner: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        renter: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
      },
    });

    if (!conversation) {
      // Starting a chat should always have inquiry context for the same listing.
      await this.inquiryService.create(renterId, {
        listingId,
        source: 'chat',
      });

      conversation = await this.prisma.conversation.findUnique({
        where: { listingId_renterId: { listingId, renterId } },
        include: {
          listing: { select: { id: true, title: true, images: { take: 1 } } },
          owner: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
          renter: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            listingId,
            ownerId: listing.ownerId,
            renterId,
          },
          include: {
            listing: { select: { id: true, title: true, images: { take: 1 } } },
            owner: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            renter: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
          },
        });
      }
    }

    return this.formatConversationForUser(conversation, renterId);
  }

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ ownerId: userId }, { renterId: userId }],
      },
      include: {
        listing: { select: { id: true, title: true, images: { take: 1 } } },
        owner: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        renter: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        inquiry: {
          select: {
            id: true,
            status: true,
            source: true,
            createdAt: true,
            budgetMin: true,
            budgetMax: true,
            preferredAt: true,
            message: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    // Add unread count for each conversation
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return this.formatConversationForUser(conv, userId, unreadCount);
      }),
    );

    return withUnread;
  }

  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        listing: { select: { id: true, title: true, images: { take: 1 } } },
        owner: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        renter: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        inquiry: {
          select: {
            id: true,
            status: true,
            source: true,
            createdAt: true,
            budgetMin: true,
            budgetMax: true,
            preferredAt: true,
            message: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.ownerId !== userId && conversation.renterId !== userId) {
      throw new ForbiddenException('Not your conversation');
    }

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
    });

    return this.formatConversationForUser(conversation, userId, unreadCount);
  }

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.ownerId !== userId && conversation.renterId !== userId) {
      throw new ForbiddenException('Not your conversation');
    }

    const cursorObj = cursor ? { id: cursor } : undefined;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursorObj && { cursor: cursorObj, skip: 1 }),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      items: items.reverse(),
      meta: { hasMore, cursor: hasMore ? items[items.length - 1].id : undefined },
    };
  }

  async sendMessage(conversationId: string, senderId: string, content: string, messageType: MessageType = MessageType.TEXT, imageUrl?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.ownerId !== senderId && conversation.renterId !== senderId) {
      throw new ForbiddenException('Not your conversation');
    }

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content, messageType, imageUrl },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  }

  private formatConversationForUser(
    conversation: any,
    userId: string,
    unreadCount?: number,
  ) {
    return {
      ...conversation,
      lastMessage: conversation.messages?.[0] || null,
      unreadCount: unreadCount ?? 0,
      otherUser: conversation.ownerId === userId ? conversation.renter : conversation.owner,
    };
  }
}
