import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ProviderResult,
  WhatsappAdapter,
  WhatsappMessage,
} from './provider.interface';

/**
 * Gupshup WhatsApp Business adapter.
 * Implements the WhatsappAdapter interface so the provider can be swapped
 * (e.g. to Meta Cloud API or Twilio) without touching callers.
 */
@Injectable()
export class GupshupWhatsappProvider implements WhatsappAdapter {
  private readonly logger = new Logger(GupshupWhatsappProvider.name);
  private apiKey?: string;
  private appName?: string;
  private source?: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GUPSHUP_API_KEY');
    this.appName = config.get<string>('GUPSHUP_APP_NAME');
    this.source = config.get<string>('GUPSHUP_SOURCE_NUMBER');
    if (!this.apiKey) {
      this.logger.warn('GUPSHUP_API_KEY not configured — WhatsApp will be logged only');
    }
  }

  async send(msg: WhatsappMessage): Promise<ProviderResult> {
    if (!this.apiKey || !this.appName || !this.source) {
      this.logger.log(`[DEV] WhatsApp to ${msg.to}: ${msg.body}`);
      return { success: true, providerMessageId: 'dev-' + Date.now() };
    }

    try {
      const destination = msg.to.replace('+', '');
      const message = msg.templateId
        ? {
            type: 'template',
            template: {
              id: msg.templateId,
              params: msg.templateParams || [],
            },
          }
        : msg.mediaUrl
          ? { type: 'image', originalUrl: msg.mediaUrl, previewUrl: msg.mediaUrl, caption: msg.body }
          : { type: 'text', text: msg.body };

      const params = new URLSearchParams({
        channel: 'whatsapp',
        source: this.source,
        destination,
        'src.name': this.appName,
        message: JSON.stringify(message),
      });

      const res = await axios.post('https://api.gupshup.io/sm/api/v1/msg', params.toString(), {
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });

      return { success: true, providerMessageId: res.data?.messageId };
    } catch (err: any) {
      this.logger.error(`Gupshup send failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
