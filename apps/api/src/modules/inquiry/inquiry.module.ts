import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../subscription/subscription.module';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';

@Module({
  imports: [SubscriptionModule],
  controllers: [InquiryController],
  providers: [InquiryService],
  exports: [InquiryService],
})
export class InquiryModule {}
