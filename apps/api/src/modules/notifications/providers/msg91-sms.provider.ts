import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ProviderResult,
  SmsMessage,
  SmsProvider,
} from './provider.interface';

@Injectable()
export class Msg91SmsProvider implements SmsProvider {
  private readonly logger = new Logger(Msg91SmsProvider.name);
  private authKey?: string;
  private senderId?: string;

  constructor(config: ConfigService) {
    this.authKey = config.get<string>('MSG91_AUTH_KEY');
    this.senderId = config.get<string>('MSG91_SENDER_ID');
    if (!this.authKey) {
      this.logger.warn('MSG91_AUTH_KEY not configured — SMS will be logged only');
    }
  }

  async send(msg: SmsMessage): Promise<ProviderResult> {
    if (!this.authKey) {
      this.logger.log(`[DEV] SMS to ${msg.to}: ${msg.body}`);
      return { success: true, providerMessageId: 'dev-' + Date.now() };
    }

    try {
      // MSG91 Flow API for transactional SMS
      const payload: any = {
        sender: this.senderId,
        recipients: [{ mobiles: msg.to.replace('+', '') }],
      };
      if (msg.templateId) {
        payload.template_id = msg.templateId;
        if (msg.vars) Object.assign(payload.recipients[0], msg.vars);
      } else {
        payload.message = msg.body;
      }

      const res = await axios.post('https://control.msg91.com/api/v5/flow/', payload, {
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return { success: true, providerMessageId: res.data?.request_id };
    } catch (err: any) {
      this.logger.error(`MSG91 send failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
