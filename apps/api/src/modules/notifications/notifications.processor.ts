import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATIONS_QUEUE, NotificationJob } from './notifications.types';
import { NotificationsService } from './notifications.service';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    try {
      await this.notifications.dispatch(job.data);
    } catch (err: any) {
      this.logger.error(`Job ${job.id} (${job.name}) failed: ${err.message}`);
      throw err; // BullMQ will retry per attempts/backoff config
    }
  }
}
