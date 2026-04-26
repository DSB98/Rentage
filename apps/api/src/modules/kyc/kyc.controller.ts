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
import { KycStatus, UserRole } from '@rentage/shared-types';
import { CurrentUser, Roles } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { KycService } from './kyc.service';
import { ReviewKycDto, SubmitKycDto } from './dto';

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submissions')
  @ApiOperation({ summary: 'Submit KYC documents' })
  async submit(@CurrentUser('id') userId: string, @Body() dto: SubmitKycDto) {
    return this.kycService.submit(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get latest KYC submission for current user' })
  async getMine(@CurrentUser('id') userId: string) {
    return this.kycService.getMine(userId);
  }

  @Get('my-submissions')
  @ApiOperation({ summary: 'List KYC submissions for current user' })
  async listMine(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kycService.listMine(userId, cursor, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('admin/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List KYC submissions for admin/moderator review' })
  async listForAdmin(
    @CurrentUser('role') role: string,
    @Query('status') status?: KycStatus,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kycService.listForAdmin(role, {
      status,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('admin/submissions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get KYC submission detail for admin review' })
  async getByIdForAdmin(@Param('id') id: string, @CurrentUser('role') role: string) {
    return this.kycService.getByIdForAdmin(id, role);
  }

  @Patch('admin/submissions/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Review KYC submission' })
  async review(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @CurrentUser('role') role: string,
    @Body() dto: ReviewKycDto,
  ) {
    return this.kycService.review(id, reviewerId, role, dto);
  }
}
