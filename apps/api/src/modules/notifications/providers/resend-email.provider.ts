import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  EmailMessage,
  EmailProvider,
  ProviderResult,
} from './provider.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private client: Resend | null = null;
  private from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('EMAIL_FROM', 'Rentage <no-reply@rentage.in>');
    if (apiKey) {
      this.client = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not configured — emails will be logged only');
    }
  }

  async send(msg: EmailMessage): Promise<ProviderResult> {
    if (!this.client) {
      this.logger.log(`[DEV] Email to ${msg.to}: ${msg.subject}`);
      return { success: true, providerMessageId: 'dev-' + Date.now() };
    }

    try {
      const result = await this.client.emails.send({
        from: this.from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        replyTo: msg.replyTo,
        attachments: msg.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true, providerMessageId: result.data?.id };
    } catch (err: any) {
      this.logger.error(`Resend send failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
