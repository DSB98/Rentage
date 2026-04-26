import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RazorpayService } from './razorpay.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, RazorpayService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
