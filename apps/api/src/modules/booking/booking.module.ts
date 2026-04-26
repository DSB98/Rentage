import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../subscription/subscription.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [SubscriptionModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
