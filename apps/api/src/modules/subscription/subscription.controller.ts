import { Body, Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CancelSubscriptionDto, CreateSubscriptionDto } from './dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'List all active public plans' })
  async listPlans(@Query('audience') audience?: string) {
    return this.subscriptionService.listPublicPlans(audience);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  async mine(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getMySubscription(userId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current usage vs plan limits for current user' })
  async usage(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getMyUsage(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create/activate subscription for current user' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(userId, dto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current user subscription' })
  async cancel(@CurrentUser('id') userId: string, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionService.cancel(userId, dto);
  }

  @Post('webhook/razorpay')
  @Public()
  @ApiOperation({ summary: 'Razorpay webhook callback' })
  async webhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    return this.subscriptionService.handleWebhook(payload, signature);
  }
}
