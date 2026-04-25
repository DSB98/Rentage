import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  ProviderResult,
  PushMessage,
  PushProvider,
} from './provider.interface';

@Injectable()
export class FcmPushProvider implements PushProvider, OnModuleInit {
  private readonly logger = new Logger(FcmPushProvider.name);
  private app: admin.app.App | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase credentials not set — push will be logged only');
      return;
    }

    if (admin.apps.length === 0) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      this.app = admin.app();
    }
  }

  async send(msg: PushMessage): Promise<ProviderResult & { invalidTokens?: string[] }> {
    if (!this.app) {
      this.logger.log(`[DEV] Push to ${msg.tokens.length} tokens: ${msg.title}`);
      return { success: true, providerMessageId: 'dev-' + Date.now() };
    }
    if (msg.tokens.length === 0) {
      return { success: true };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: msg.tokens,
        notification: {
          title: msg.title,
          body: msg.body,
          imageUrl: msg.imageUrl,
        },
        data: msg.data,
      });

      const invalidTokens: string[] = [];
      response.responses.forEach((r, i) => {
        if (!r.success && r.error) {
          const code = r.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(msg.tokens[i]);
          }
        }
      });

      return {
        success: response.failureCount < response.successCount,
        providerMessageId: `fcm-${Date.now()}`,
        invalidTokens,
      };
    } catch (err: any) {
      this.logger.error(`FCM send failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
