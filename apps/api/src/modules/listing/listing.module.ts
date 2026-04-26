import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';

@Module({
  imports: [SubscriptionModule],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}
