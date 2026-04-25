import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import {
  EMAIL_PROVIDER,
  PUSH_PROVIDER,
  SMS_PROVIDER,
  WHATSAPP_PROVIDER,
} from './providers/provider.interface';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { Msg91SmsProvider } from './providers/msg91-sms.provider';
import { GupshupWhatsappProvider } from './providers/gupshup-whatsapp.provider';
import { FcmPushProvider } from './providers/fcm-push.provider';
import { NOTIFICATIONS_QUEUE } from './notifications.types';

const isRedisConfigured = () => !!process.env.REDIS_URL;

const queueImports = isRedisConfigured()
  ? [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const url = new URL(config.get<string>('REDIS_URL') || 'redis://localhost:6379');
          return {
            connection: {
              host: url.hostname,
              port: parseInt(url.port || '6379', 10),
              password: url.password || undefined,
              username: url.username || undefined,
              maxRetriesPerRequest: null,
            },
          };
        },
      }),
      BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
    ]
  : [];

@Global()
@Module({
  imports: queueImports,
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ...(isRedisConfigured() ? [NotificationsProcessor] : []),
    { provide: EMAIL_PROVIDER, useClass: ResendEmailProvider },
    { provide: SMS_PROVIDER, useClass: Msg91SmsProvider },
    { provide: WHATSAPP_PROVIDER, useClass: GupshupWhatsappProvider },
    { provide: PUSH_PROVIDER, useClass: FcmPushProvider },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
