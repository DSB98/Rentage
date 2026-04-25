import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EMAIL_PROVIDER,
  SMS_PROVIDER,
  WHATSAPP_PROVIDER,
  PUSH_PROVIDER,
  EmailProvider,
  SmsProvider,
  WhatsappAdapter,
  PushProvider,
} from './providers/provider.interface';
import { NOTIFICATIONS_QUEUE, NotificationJob } from './notifications.types';
import { Templates } from './templates/email.templates';
import { ChannelType } from '@rentage/shared-types';

interface SendMultiOptions {
  userId: string;
  category: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  url?: string;
  imageUrl?: string;
  channels?: ChannelType[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly queueEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsappAdapter,
    @Inject(PUSH_PROVIDER) private readonly push: PushProvider,
    @Optional() @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue?: Queue,
  ) {
    this.queueEnabled = !!this.queue;
    if (!this.queueEnabled) {
      this.logger.warn('Notifications queue not available — falling back to direct send');
    }
  }

  // ─── ENQUEUE / DIRECT ─────────────────────────────
  private async enqueue(job: NotificationJob, opts?: { delay?: number }) {
    if (this.queueEnabled && this.queue) {
      await this.queue.add(job.kind, job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
        delay: opts?.delay,
      });
    } else {
      // Direct fallback when Redis is unavailable
      await this.dispatch(job);
    }
  }

  // ─── PUBLIC HELPERS (templated) ───────────────────
  async sendEmailVerification(_userId: string, email: string, name: string, token: string) {
    const url = `${this.config.get<string>('APP_URL')}/auth/verify-email?token=${token}`;
    const tpl = Templates.emailVerification({ name, url });
    return this.enqueue({ kind: 'email', to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  async sendPasswordReset(email: string, name: string, token: string) {
    const url = `${this.config.get<string>('APP_URL')}/auth/reset-password?token=${token}`;
    const tpl = Templates.passwordReset({ name, url });
    return this.enqueue({ kind: 'email', to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  }

  async sendOtpSms(phone: string, otp: string) {
    return this.enqueue({
      kind: 'sms',
      to: phone,
      body: `Your Rentage verification code is ${otp}. Valid for 5 minutes.`,
      templateId: this.config.get<string>('MSG91_OTP_TEMPLATE_ID'),
      vars: { OTP: otp },
    });
  }

  /**
   * Multi-channel send respecting NotificationPreference.
   * Always writes an in-app Notification row; other channels gated by preferences.
   */
  async sendMulti(opts: SendMultiOptions) {
    return this.enqueue({
      kind: 'multi',
      userId: opts.userId,
      category: opts.category,
      title: opts.title,
      body: opts.body,
      data: opts.data,
      url: opts.url,
      imageUrl: opts.imageUrl,
      channels: opts.channels as any,
    });
  }

  // ─── DISPATCH (called by processor or direct fallback) ─────────────
  async dispatch(job: NotificationJob): Promise<void> {
    switch (job.kind) {
      case 'email':
        await this.email.send({ to: job.to, subject: job.subject, html: job.html, text: job.text });
        return;

      case 'sms':
        await this.sms.send({ to: job.to, body: job.body, templateId: job.templateId, vars: job.vars });
        return;

      case 'whatsapp':
        await this.whatsapp.send({
          to: job.to,
          body: job.body,
          templateId: job.templateId,
          templateParams: job.templateParams,
          mediaUrl: job.mediaUrl,
        });
        return;

      case 'push': {
        const tokens = await this.prisma.fcmToken.findMany({
          where: { userId: job.userId, isActive: true },
          select: { token: true },
        });
        if (tokens.length === 0) return;
        const result = await this.push.send({
          tokens: tokens.map((t) => t.token),
          title: job.title,
          body: job.body,
          data: job.data,
          imageUrl: job.imageUrl,
        });
        if (result.invalidTokens?.length) {
          await this.prisma.fcmToken.updateMany({
            where: { token: { in: result.invalidTokens } },
            data: { isActive: false },
          });
        }
        return;
      }

      case 'multi':
        await this.handleMulti(job);
        return;
    }
  }

  // ─── INTERNAL: multi-channel fan-out ──────────────
  private async handleMulti(job: Extract<NotificationJob, { kind: 'multi' }>) {
    const user = await this.prisma.user.findUnique({
      where: { id: job.userId },
      include: { profile: true, notificationPrefs: true, fcmTokens: true },
    });
    if (!user) return;

    // Always create an in-app notification record
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: job.category,
        channel: 'IN_APP',
        title: job.title,
        body: job.body,
        data: (job.data as any) || undefined,
        imageUrl: job.imageUrl,
        sentAt: new Date(),
      },
    });

    const allowed = (channel: ChannelType) => {
      // Default-on: if no preference row, channel is enabled
      const pref = user.notificationPrefs.find(
        (p) => p.channel === channel && p.category === job.category,
      );
      return pref ? pref.enabled : true;
    };

    const channels = job.channels && job.channels.length > 0
      ? job.channels
      : (['EMAIL', 'PUSH'] as ChannelType[]);

    // Email
    if (channels.includes(ChannelType.EMAIL) && allowed(ChannelType.EMAIL) && user.email) {
      const tpl = Templates.generic({ title: job.title, body: job.body, url: job.url });
      await this.email.send({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    }

    // SMS
    if (channels.includes(ChannelType.SMS) && allowed(ChannelType.SMS) && user.profile?.phone) {
      await this.sms.send({ to: user.profile.phone, body: `${job.title}: ${job.body}` });
    }

    // WhatsApp
    if (channels.includes(ChannelType.WHATSAPP) && allowed(ChannelType.WHATSAPP) && user.profile?.phone) {
      await this.whatsapp.send({ to: user.profile.phone, body: `${job.title}\n\n${job.body}` });
    }

    // Push
    if (channels.includes(ChannelType.PUSH) && allowed(ChannelType.PUSH) && user.fcmTokens.length > 0) {
      const tokens = user.fcmTokens.filter((t) => t.isActive).map((t) => t.token);
      if (tokens.length > 0) {
        const result = await this.push.send({
          tokens,
          title: job.title,
          body: job.body,
          data: this.flattenData(job.data),
          imageUrl: job.imageUrl,
        });
        if (result.invalidTokens?.length) {
          await this.prisma.fcmToken.updateMany({
            where: { token: { in: result.invalidTokens } },
            data: { isActive: false },
          });
        }
      }
    }
  }

  private flattenData(data?: Record<string, any>): Record<string, string> | undefined {
    if (!data) return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    return out;
  }

  // ─── In-app notification API ──────────────────────
  async listForUser(userId: string, params: { unreadOnly?: boolean; cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit || 20, 100);
    const items = await this.prisma.notification.findMany({
      where: { userId, ...(params.unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    return { items: sliced, meta: { hasMore, nextCursor: hasMore ? sliced[sliced.length - 1].id : null } };
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
