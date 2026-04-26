import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingStatus, UserRole } from '@rentage/shared-types';
import { Prisma } from '@prisma/client';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class ListingService {
  constructor(
    private prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  private normalizeListingWriteData(data: any) {
    const { amenities, categoryId, securityDeposit, ...rest } = data || {};
    const normalized: any = { ...rest };

    if (securityDeposit !== undefined && rest.depositAmount === undefined) {
      normalized.depositAmount = securityDeposit;
    }

    if (typeof categoryId === 'string' && categoryId.trim()) {
      normalized.category = { connect: { id: categoryId } };
    }

    delete normalized.categoryId;
    delete normalized.securityDeposit;

    return { amenities, normalized };
  }

  async create(ownerId: string, data: any) {
    await this.subscriptionService.assertListingCreationAllowed(ownerId);

    const { amenities, normalized } = this.normalizeListingWriteData(data);

    const listing = await this.prisma.listing.create({
      data: {
        ...normalized,
        owner: { connect: { id: ownerId } },
        status: ListingStatus.PENDING_APPROVAL,
        amenities: amenities?.length
          ? { createMany: { data: amenities } }
          : undefined,
      },
      include: { images: true, amenities: true, category: true },
    });

    return listing;
  }

  async findById(id: string, viewerId?: string, viewerRole?: string) {
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

    const isPrivilegedViewer =
      viewerId === listing.ownerId ||
      viewerRole === UserRole.ADMIN ||
      viewerRole === UserRole.SUPER_ADMIN ||
      viewerRole === UserRole.MODERATOR;

    if (!isPrivilegedViewer && listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async search(params: {
    query?: string;
    categoryId?: string;
    city?: string;
    state?: string;
    nearListingId?: string;
    excludeId?: string;
    minPrice?: number;
    maxPrice?: number;
    rentPeriod?: string;
    featured?: boolean;
    sort?: string;
    cursor?: string;
    limit?: number;
  }) {
    // Keep owner active listings aligned with subscription limits before serving public feed.
    const rawOwnerIds = await this.prisma.listing.findMany({
      where: { status: ListingStatus.ACTIVE },
      select: { ownerId: true },
      distinct: ['ownerId'],
    });
    if (rawOwnerIds.length > 0) {
      await Promise.all(
        rawOwnerIds.map((row) => this.subscriptionService.enforceOwnerActiveListingLimit(row.ownerId)),
      );
    }

    const limit = params.limit || 20;
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
    };

    if (params.excludeId) {
      where.id = { not: params.excludeId };
    }

    if (params.featured) {
      where.isFeatured = true;
    }

    if (params.query) {
      where.OR = [
        { title: { contains: params.query } },
        { description: { contains: params.query } },
      ];
    }

    let nearContextCity: string | undefined;
    let nearContextState: string | undefined;
    if (params.nearListingId) {
      const nearListing = await this.prisma.listing.findUnique({
        where: { id: params.nearListingId },
        select: {
          id: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
        },
      });

      if (nearListing) {
        nearContextCity = nearListing.city || undefined;
        nearContextState = nearListing.state || undefined;

        if (
          typeof nearListing.latitude === 'number' &&
          typeof nearListing.longitude === 'number'
        ) {
          const latDelta = 0.35;
          const lonDelta =
            0.35 / Math.max(Math.cos((nearListing.latitude * Math.PI) / 180), 0.2);

          where.latitude = {
            gte: nearListing.latitude - latDelta,
            lte: nearListing.latitude + latDelta,
          };

          where.longitude = {
            gte: nearListing.longitude - lonDelta,
            lte: nearListing.longitude + lonDelta,
          };
        }
      }
    }

    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.city) {
      where.city = { contains: params.city };
    } else if (nearContextCity) {
      where.city = { contains: nearContextCity };
    }

    if (params.state) {
      where.state = params.state;
    } else if (nearContextState) {
      where.state = nearContextState;
    }

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
    await this.subscriptionService.enforceOwnerActiveListingLimit(ownerId);

    const where: Prisma.ListingWhereInput = { ownerId };
    if (status) where.status = status as any;

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

    const { amenities, normalized } = this.normalizeListingWriteData(data);

    if (normalized.status === ListingStatus.ACTIVE) {
      if (listing.status === ListingStatus.REJECTED) {
        throw new BadRequestException(
          'Rejected listings cannot be activated directly. Please resubmit for approval after fixing issues.',
        );
      }
      await this.subscriptionService.assertListingActivationAllowed(listing.ownerId, listing.id);
    }

    if (amenities) {
      await this.prisma.listingAmenity.deleteMany({ where: { listingId: id } });
      await this.prisma.listingAmenity.createMany({
        data: amenities.map((a: any) => ({ ...a, listingId: id })),
      });
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: normalized,
      include: { images: true, amenities: true, category: true },
    });

    await this.subscriptionService.enforceOwnerActiveListingLimit(listing.ownerId);

    return updated;
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
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.ACTIVE, rejectionReason: null },
    });

    await this.subscriptionService.enforceOwnerActiveListingLimit(updated.ownerId);

    return this.prisma.listing.findUnique({
      where: { id: updated.id },
      include: { images: true, amenities: true, category: true },
    });
  }

  async rejectListing(id: string, reason: string) {
    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.REJECTED, rejectionReason: reason },
    });
  }

  async resubmitRejected(id: string, userId: string, role: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not your listing');
    }
    if (listing.status !== ListingStatus.REJECTED) {
      throw new BadRequestException('Only rejected listings can be resubmitted');
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        status: ListingStatus.PENDING_APPROVAL,
        rejectionReason: null,
      },
      include: { images: true, amenities: true, category: true },
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

  async revealContact(revealerId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId === revealerId) {
      throw new BadRequestException('You cannot reveal contact for your own listing');
    }

    const existing = await this.prisma.contactReveal.findUnique({
      where: {
        revealerId_listingId: {
          revealerId,
          listingId,
        },
      },
      select: { id: true, createdAt: true },
    });

    if (!existing) {
      await this.subscriptionService.assertContactRevealAllowed(revealerId);

      await this.prisma.contactReveal.create({
        data: {
          revealerId,
          ownerId: listing.ownerId,
          listingId,
        },
      });
    }

    return {
      revealed: true,
      alreadyRevealed: Boolean(existing),
      owner: {
        id: listing.owner.id,
        fullName: listing.owner.profile?.fullName || 'Owner',
        phone: listing.owner.profile?.phone || null,
        email: listing.owner.email,
      },
    };
  }

  async getRevealStatus(userId: string, listingId: string) {
    const reveal = await this.prisma.contactReveal.findUnique({
      where: {
        revealerId_listingId: {
          revealerId: userId,
          listingId,
        },
      },
      select: { id: true, createdAt: true },
    });

    return {
      isRevealed: Boolean(reveal),
      revealedAt: reveal?.createdAt || null,
    };
  }
}
