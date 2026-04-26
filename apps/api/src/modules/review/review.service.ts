import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewStatus, UserRole } from '@rentage/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewStatusDto } from './dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      select: {
        id: true,
        listingId: true,
        renterId: true,
        ownerId: true,
        status: true,
        endDate: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isParticipant = booking.renterId === authorId || booking.ownerId === authorId;
    if (!isParticipant) {
      throw new ForbiddenException('Only booking participants can review');
    }

    const isCompleted =
      booking.status === 'COMPLETED' || new Date(booking.endDate).getTime() <= Date.now();
    if (!isCompleted) {
      throw new BadRequestException('Review allowed only after booking completion');
    }

    const subjectId = booking.renterId === authorId ? booking.ownerId : booking.renterId;

    const existing = await this.prisma.review.findFirst({
      where: {
        bookingId: booking.id,
        authorId,
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('You already reviewed this booking');
    }

    const created = await this.prisma.review.create({
      data: {
        listingId: booking.listingId,
        bookingId: booking.id,
        authorId,
        subjectId,
        rating: dto.rating,
        body: dto.comment,
        status: ReviewStatus.PUBLISHED,
      },
      include: {
        author: { select: { id: true, profile: true } },
        subject: { select: { id: true, profile: true } },
      },
    });

    await this.recalculateListingRating(booking.listingId);
    return created;
  }

  async listByListing(listingId: string, cursor?: string, limit = 20) {
    const take = Math.min(limit, 100);
    const rows = await this.prisma.review.findMany({
      where: { listingId, status: ReviewStatus.PUBLISHED },
      include: {
        author: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;

    return {
      items,
      meta: {
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    };
  }

  async listMine(userId: string, cursor?: string, limit = 20) {
    const take = Math.min(limit, 100);
    const rows = await this.prisma.review.findMany({
      where: { authorId: userId },
      include: {
        listing: { select: { id: true, title: true } },
        subject: { select: { id: true, profile: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;

    return {
      items,
      meta: {
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    };
  }

  async updateStatus(id: string, actorRole: string, dto: UpdateReviewStatusDto) {
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR].includes(actorRole as UserRole)) {
      throw new ForbiddenException('Only admin/moderator can update review status');
    }

    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { status: dto.status },
    });

    if (review.listingId) {
      await this.recalculateListingRating(review.listingId);
    }

    return updated;
  }

  private async recalculateListingRating(listingId: string) {
    const agg = await this.prisma.review.aggregate({
      where: {
        listingId,
        status: ReviewStatus.PUBLISHED,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        ratingAvg: Number((agg._avg.rating || 0).toFixed(2)),
        ratingCount: agg._count.rating || 0,
      },
    });
  }
}
