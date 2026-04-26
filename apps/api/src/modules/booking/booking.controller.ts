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
import { BookingStatus } from '@rentage/shared-types';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking with availability check' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingService.create(userId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List bookings for current renter' })
  async listMine(
    @CurrentUser('id') userId: string,
    @Query('status') status?: BookingStatus,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingService.listForRenter(
      userId,
      { status, cursor, createdFrom, createdTo },
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('owner')
  @ApiOperation({ summary: 'List bookings for current owner' })
  async listOwner(
    @CurrentUser('id') userId: string,
    @Query('status') status?: BookingStatus,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingService.listForOwner(
      userId,
      { status, cursor, createdFrom, createdTo },
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail' })
  async getById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.bookingService.getById(id, userId, role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(id, actorId, role, dto);
  }
}
