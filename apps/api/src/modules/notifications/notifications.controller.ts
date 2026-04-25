import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelType, DevicePlatform } from '@rentage/shared-types';

class RegisterFcmDto {
  @IsString()
  @MaxLength(500)
  token!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsOptional() @IsString() deviceId?: string;
  @IsOptional() @IsString() appVersion?: string;
}

class UpdatePreferenceDto {
  @IsEnum(ChannelType) channel!: ChannelType;
  @IsString() category!: string;
  enabled!: boolean;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for current user' })
  async list(
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listForUser(userId, {
      unreadOnly: unreadOnly === 'true',
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@CurrentUser('id') userId: string) {
    const count = await this.service.unreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async read(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.service.markRead(userId, id);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async readAll(@CurrentUser('id') userId: string) {
    await this.service.markAllRead(userId);
    return { success: true };
  }

  @Post('fcm-tokens')
  @ApiOperation({ summary: 'Register / refresh an FCM device token' })
  async registerFcm(@CurrentUser('id') userId: string, @Body() dto: RegisterFcmDto) {
    return this.prisma.fcmToken.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform: dto.platform,
        deviceId: dto.deviceId,
        appVersion: dto.appVersion,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        deviceId: dto.deviceId,
        appVersion: dto.appVersion,
      },
    });
  }

  @Delete('fcm-tokens/:token')
  @ApiOperation({ summary: 'Unregister an FCM device token' })
  async deleteFcm(@CurrentUser('id') userId: string, @Param('token') token: string) {
    await this.prisma.fcmToken.deleteMany({ where: { userId, token } });
    return { success: true };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for current user' })
  async listPrefs(@CurrentUser('id') userId: string) {
    return this.prisma.notificationPreference.findMany({ where: { userId } });
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Upsert a notification preference' })
  async upsertPref(@CurrentUser('id') userId: string, @Body() dto: UpdatePreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_channel_category: {
          userId,
          channel: dto.channel,
          category: dto.category,
        },
      },
      update: { enabled: dto.enabled },
      create: { userId, channel: dto.channel, category: dto.category, enabled: dto.enabled },
    });
  }
}
