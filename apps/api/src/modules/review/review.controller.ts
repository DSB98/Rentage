import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto, UpdateReviewStatusDto } from './dto';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create review for completed booking' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(userId, dto);
  }

  @Get('listing/:listingId')
  @ApiOperation({ summary: 'List public reviews for listing' })
  async listByListing(
    @Param('listingId') listingId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.listByListing(listingId, cursor, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List my authored reviews' })
  async listMine(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.listMine(userId, cursor, limit ? parseInt(limit, 10) : undefined);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Moderate review status (admin/moderator)' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.reviewService.updateStatus(id, role, dto);
  }
}
