import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ListingService } from './listing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@rentage/shared-types';

@ApiTags('Listings')
@Controller('listings')
export class ListingController {
  constructor(private listingService: ListingService) {}

  // ─── STATIC ROUTES (must come before :id) ────────

  @Get('search')
  @ApiOperation({ summary: 'Search listings with filters' })
  async search(
    @Query('query') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('nearListingId') nearListingId?: string,
    @Query('excludeId') excludeId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('rentPeriod') rentPeriod?: string,
    @Query('featured') featured?: string,
    @Query('sort') sort?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingService.search({
      query,
      categoryId,
      city,
      state,
      nearListingId,
      excludeId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      rentPeriod, sort, cursor,
      featured: featured === 'true' ? true : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('owner/my-listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my listings (owner)' })
  async getMyListings(@CurrentUser('id') userId: string, @Query('status') status?: string) {
    return this.listingService.getOwnerListings(userId, status);
  }

  @Get('user/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved listings' })
  async getSaved(@CurrentUser('id') userId: string) {
    return this.listingService.getSavedListings(userId);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending listings (admin)' })
  async getPending() {
    return this.listingService.getPendingListings();
  }

  // ─── PARAMETERIZED ROUTES ─────────────────────────

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get listing by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') role?: string,
  ) {
    return this.listingService.findById(id, userId, role);
  }

  // ─── OWNER ────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create listing (owner)' })
  async create(@CurrentUser('id') userId: string, @Body() data: any) {
    return this.listingService.create(userId, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() data: any,
  ) {
    return this.listingService.update(id, userId, role, data);
  }

  @Post(':id/resubmit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resubmit a rejected listing for admin approval' })
  async resubmitRejected(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.listingService.resubmitRejected(id, userId, role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete listing' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.listingService.delete(id, userId, role);
  }

  // ─── IMAGES ───────────────────────────────────────

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add images to listing' })
  async addImages(
    @Param('id') listingId: string,
    @Body() body: { images: { url: string; publicId: string; sortOrder: number }[] },
  ) {
    return this.listingService.addImages(listingId, body.images);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from listing' })
  async removeImage(@Param('imageId') imageId: string) {
    return this.listingService.removeImage(imageId);
  }

  // ─── SAVED ────────────────────────────────────────

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save listing to favorites' })
  async save(@CurrentUser('id') userId: string, @Param('id') listingId: string) {
    return this.listingService.saveListing(userId, listingId);
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove listing from favorites' })
  async unsave(@CurrentUser('id') userId: string, @Param('id') listingId: string) {
    return this.listingService.unsaveListing(userId, listingId);
  }

  @Post(':id/reveal-contact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reveal owner contact for this listing (plan-limited)' })
  async revealContact(@CurrentUser('id') userId: string, @Param('id') listingId: string) {
    return this.listingService.revealContact(userId, listingId);
  }

  @Get(':id/reveal-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if contact is already revealed (no quota deduction)' })
  async getRevealStatus(@CurrentUser('id') userId: string, @Param('id') listingId: string) {
    return this.listingService.getRevealStatus(userId, listingId);
  }

  // ─── ADMIN ────────────────────────────────────────

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve listing (admin)' })
  async approve(@Param('id') id: string) {
    return this.listingService.approveListing(id);
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject listing (admin)' })
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.listingService.rejectListing(id, reason);
  }
}
