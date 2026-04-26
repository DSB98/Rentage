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
import { InquiryStatus } from '@rentage/shared-types';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InquiryService } from './inquiry.service';
import {
  AddInquiryNoteDto,
  AssignInquiryDto,
  ConvertInquiryToBookingDto,
  CreateInquiryDto,
  UpdateInquiryStatusDto,
} from './dto';

@ApiTags('Inquiries')
@Controller('inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post()
  @ApiOperation({ summary: 'Create inquiry and auto-link conversation' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateInquiryDto) {
    return this.inquiryService.create(userId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List inquiries for current user' })
  async listMine(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('status') status?: InquiryStatus,
    @Query('scope') scope?: 'renter' | 'owner' | 'assignee',
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inquiryService.listForUser(userId, role, {
      status,
      scope,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inquiry detail' })
  async getById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.inquiryService.getById(id, userId, role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inquiry status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    return this.inquiryService.updateStatus(id, actorId, role, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign inquiry to an agent/user' })
  async assign(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
    @Body() dto: AssignInquiryDto,
  ) {
    return this.inquiryService.assign(id, actorId, role, dto);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to inquiry activity log' })
  async addNote(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
    @Body() dto: AddInquiryNoteDto,
  ) {
    return this.inquiryService.addNote(id, actorId, role, dto);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'List inquiry activities' })
  async listActivities(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inquiryService.listActivities(
      id,
      userId,
      role,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('owner/list')
  @ApiOperation({ summary: 'List inquiries on owner listings' })
  async listOwner(
    @CurrentUser('id') ownerId: string,
    @Query('status') status?: InquiryStatus,
    @Query('listingId') listingId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inquiryService.listForOwner(ownerId, {
      status,
      listingId,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('admin/list')
  @ApiOperation({ summary: 'List all inquiries (admin only)' })
  async listAdmin(
    @CurrentUser('role') role: string,
    @Query('status') status?: InquiryStatus,
    @Query('listingId') listingId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('renterId') renterId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
      throw new Error('Unauthorized');
    }
    return this.inquiryService.listForAdmin({
      status,
      listingId,
      ownerId,
      renterId,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':id/convert-to-booking')
  @ApiOperation({ summary: 'Convert inquiry to booking' })
  async convertToBooking(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
    @Body() dto: ConvertInquiryToBookingDto,
  ) {
    return this.inquiryService.convertToBooking(id, actorId, role, dto);
  }
}
