import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

type CreateRazorpaySubscriptionInput = {
  planId: string;
  customerNotify?: boolean;
  totalCount?: number;
  startAt?: number;
  notes?: Record<string, string>;
};

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly webhookSecret: string;
  private readonly client?: Razorpay;

  constructor(private readonly config: ConfigService) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';

    if (keyId && keySecret) {
      this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn('Razorpay keys missing. Payment gateway calls will use local fallback.');
    }
  }

  isEnabled() {
    return Boolean(this.client);
  }

  async createSubscription(input: CreateRazorpaySubscriptionInput): Promise<any | null> {
    if (!this.client) {
      return null;
    }

    return this.client.subscriptions.create({
      plan_id: input.planId,
      customer_notify: input.customerNotify === false ? 0 : 1,
      total_count: input.totalCount || 12,
      ...(input.startAt ? { start_at: input.startAt } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    } as any);
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = true): Promise<any | null> {
    if (!this.client) {
      return null;
    }

    return this.client.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  }

  verifyWebhookSignature(payload: unknown, signature?: string) {
    if (!this.webhookSecret || !signature) {
      return false;
    }

    const body = JSON.stringify(payload);
    const digest = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    const expected = Buffer.from(digest, 'utf8');
    const received = Buffer.from(signature, 'utf8');

    if (expected.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, received);
  }
}
