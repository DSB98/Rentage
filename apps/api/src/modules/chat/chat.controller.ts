import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Get or create conversation for a listing' })
  async getOrCreateConversation(
    @CurrentUser('id') userId: string,
    @Body('listingId') listingId: string,
  ) {
    return this.chatService.getOrCreateConversation(listingId, userId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all user conversations' })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(conversationId, userId, cursor, limit ? parseInt(limit) : undefined);
  }
}
