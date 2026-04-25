import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingStatus, UserRole } from '@rentage/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ListingService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: any) {
    const { amenities, ...listingData } = data;

    const listing = await this.prisma.listing.create({
      data: {
        ...listingData,
        ownerId,
        status: ListingStatus.PENDING_APPROVAL,
        amenities: amenities?.length
          ? { createMany: { data: amenities } }
          : undefined,
      },
      include: { images: true, amenities: true, category: true },
    });

    return listing;
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: true,
        category: true,
        owner: {
          select: {
            id: true,
            profile: { select: { fullName: true, avatarUrl: true, city: true } },
          },
        },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async search(params: {
    query?: string;
    categoryId?: string;
    city?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    rentPeriod?: string;
    featured?: boolean;
    sort?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = params.limit || 20;
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
    };

    if (params.featured) {
      where.isFeatured = true;
    }

    if (params.query) {
      where.OR = [
        { title: { contains: params.query } },
        { description: { contains: params.query } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.city) where.city = { contains: params.city };
    if (params.state) where.state = params.state;
    if (params.minPrice || params.maxPrice) {
      where.price = {};
      if (params.minPrice) where.price.gte = params.minPrice;
      if (params.maxPrice) where.price.lte = params.maxPrice;
    }
    if (params.rentPeriod) where.rentPeriod = params.rentPeriod as any;

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      params.sort === 'price_asc' ? { price: 'asc' } :
      params.sort === 'price_desc' ? { price: 'desc' } :
      { createdAt: 'desc' };

    const cursorObj = params.cursor ? { id: params.cursor } : undefined;

    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        images: { take: 5, orderBy: { sortOrder: 'asc' } },
        amenities: { take: 4 },
        category: { select: { name: true, slug: true } },
        owner: {
          select: {
            id: true,
            profile: { select: { fullName: true, city: true } },
          },
        },
      },
      orderBy,
      take: limit + 1,
      ...(cursorObj && { cursor: cursorObj, skip: 1 }),
    });

    const hasMore = listings.length > limit;
    const items = hasMore ? listings.slice(0, limit) : listings;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return {
      items,
      meta: {
        limit,
        hasMore,
        cursor: nextCursor,
      },
    };
  }

  async getOwnerListings(ownerId: string, status?: string) {
    const where: Prisma.ListingWhereInput = { ownerId };
    if (status) where.status = status as ListingStatus;

    return this.prisma.listing.findMany({
      where,
      include: {
        images: { take: 1, orderBy: { sortOrder: 'asc' } },
        category: { select: { name: true, slug: true } },
        _count: { select: { conversations: true, savedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, role: string, data: any) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not your listing');
    }

    const { amenities, ...updateData } = data;

    if (amenities) {
      await this.prisma.listingAmenity.deleteMany({ where: { listingId: id } });
      await this.prisma.listingAmenity.createMany({
        data: amenities.map((a: any) => ({ ...a, listingId: id })),
      });
    }

    return this.prisma.listing.update({
      where: { id },
      data: updateData,
      include: { images: true, amenities: true, category: true },
    });
  }

  async delete(id: string, userId: string, role: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not your listing');
    }

    await this.prisma.listing.delete({ where: { id } });
    return { message: 'Listing deleted' };
  }

  // ─── ADMIN ────────────────────────────────────────

  async getPendingListings() {
    return this.prisma.listing.findMany({
      where: { status: ListingStatus.PENDING_APPROVAL },
      include: {
        images: { take: 1 },
        category: { select: { name: true } },
        owner: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveListing(id: string) {
    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.ACTIVE, rejectionReason: null },
    });
  }

  async rejectListing(id: string, reason: string) {
    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.REJECTED, rejectionReason: reason },
    });
  }

  // ─── SAVED LISTINGS ───────────────────────────────

  async saveListing(userId: string, listingId: string) {
    return this.prisma.savedListing.create({
      data: { userId, listingId },
    });
  }

  async unsaveListing(userId: string, listingId: string) {
    await this.prisma.savedListing.deleteMany({
      where: { userId, listingId },
    });
    return { message: 'Listing unsaved' };
  }

  async getSavedListings(userId: string) {
    const saved = await this.prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            images: { take: 1 },
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return saved.map((s) => s.listing);
  }

  async addImages(listingId: string, images: { url: string; publicId: string; sortOrder: number }[]) {
    return this.prisma.listingImage.createMany({
      data: images.map((img) => ({ ...img, listingId })),
    });
  }

  async removeImage(imageId: string) {
    return this.prisma.listingImage.delete({ where: { id: imageId } });
  }
}
