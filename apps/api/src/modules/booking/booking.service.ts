import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BookingStatus,
  ChannelType,
  InquiryActivityType,
  InquiryStatus,
  ListingStatus,
  RentPeriod,
  UserRole,
} from '@rentage/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(renterId: string, dto: CreateBookingDto) {
    await this.subscriptionService.assertBookingCreationAllowed(renterId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid booking dates');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: {
        id: true,
        ownerId: true,
        orgId: true,
        status: true,
        price: true,
        depositAmount: true,
        rentPeriod: true,
        title: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Booking allowed only for active listings');
    }

    if (listing.ownerId === renterId) {
      throw new ForbiddenException('Owner cannot create booking for own listing');
    }

    const overlapping = await this.prisma.listingAvailability.findFirst({
      where: {
        listingId: listing.id,
        isBlocked: true,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    });

    if (overlapping) {
      throw new BadRequestException('Selected dates are not available');
    }

    const unitCount = this.computeUnits(startDate, endDate, listing.rentPeriod as RentPeriod);
    const unitPrice = Number(listing.price);
    const totalAmount = Number((unitPrice * unitCount).toFixed(2));

    const booking = await this.prisma.$transaction(async (tx) => {
      let inquiryId: string | undefined;
      if (dto.inquiryId) {
        const inquiry = await tx.inquiry.findUnique({ where: { id: dto.inquiryId } });
        if (!inquiry) {
          throw new NotFoundException('Inquiry not found');
        }
        if (inquiry.listingId !== listing.id || inquiry.renterId !== renterId) {
          throw new ForbiddenException('Inquiry does not belong to this listing/user');
        }
        inquiryId = inquiry.id;
      }

      const created = await tx.booking.create({
        data: {
          code: this.generateBookingCode(),
          listingId: listing.id,
          inquiryId,
          renterId,
          ownerId: listing.ownerId,
          orgId: listing.orgId,
          status: BookingStatus.PENDING,
          startDate,
          endDate,
          rentPeriod: listing.rentPeriod,
          unitPrice,
          totalAmount,
          depositAmount: listing.depositAmount,
          notes: dto.notes,
        },
      });

      await tx.listingAvailability.create({
        data: {
          listingId: listing.id,
          startDate,
          endDate,
          isBlocked: true,
          reason: `Booked (${created.code})`,
          bookingId: created.id,
        },
      });

      await tx.listing.update({
        where: { id: listing.id },
        data: { bookingCount: { increment: 1 } },
      });

      if (inquiryId) {
        await tx.inquiry.update({
          where: { id: inquiryId },
          data: { status: InquiryStatus.CONVERTED },
        });
        await tx.inquiryActivity.create({
          data: {
            inquiryId,
            actorId: renterId,
            type: InquiryActivityType.BOOKING_CREATED,
            note: `Booking ${created.code} created`,
            data: { bookingId: created.id, code: created.code },
          },
        });
      }

      return created;
    });

    await this.notifications.sendMulti({
      userId: listing.ownerId,
      category: 'booking',
      title: 'New booking request',
      body: `You received a booking request for ${listing.title}.`,
      data: { bookingId: booking.id, listingId: listing.id },
      url: `/bookings/${booking.id}`,
      channels: [ChannelType.EMAIL, ChannelType.PUSH, ChannelType.IN_APP],
    });

    return this.getById(booking.id, renterId, UserRole.RENTER);
  }

  async listForRenter(
    userId: string,
    params?: {
      status?: BookingStatus;
      cursor?: string;
      createdFrom?: string;
      createdTo?: string;
    },
    limit = 20,
  ) {
    const createdAt = this.buildCreatedAtRange(params?.createdFrom, params?.createdTo);
    return this.listByWhere(
      {
        renterId: userId,
        ...(params?.status ? { status: params.status } : {}),
        ...(createdAt ? { createdAt } : {}),
      },
      params?.cursor,
      limit,
    );
  }

  async listForOwner(
    userId: string,
    params?: {
      status?: BookingStatus;
      cursor?: string;
      createdFrom?: string;
      createdTo?: string;
    },
    limit = 20,
  ) {
    const createdAt = this.buildCreatedAtRange(params?.createdFrom, params?.createdTo);
    return this.listByWhere(
      {
        ownerId: userId,
        ...(params?.status ? { status: params.status } : {}),
        ...(createdAt ? { createdAt } : {}),
      },
      params?.cursor,
      limit,
    );
  }

  async getById(id: string, userId: string, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, city: true, state: true, price: true } },
        renter: { select: { id: true, email: true, profile: true } },
        owner: { select: { id: true, email: true, profile: true } },
        inquiry: { select: { id: true, status: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.assertAccess(booking, userId, role);
    return booking;
  }

  async updateStatus(id: string, actorId: string, role: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.assertCanUpdateStatus(booking, actorId, role, dto.status);
    this.assertStatusTransitionAllowed(booking.status as BookingStatus, dto.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.booking.update({
        where: { id },
        data: {
          status: dto.status,
          cancelledAt: dto.status === BookingStatus.CANCELLED ? new Date() : null,
          cancelledReason: dto.status === BookingStatus.CANCELLED ? dto.reason || null : null,
          cancelledById: dto.status === BookingStatus.CANCELLED ? actorId : null,
          confirmedAt: dto.status === BookingStatus.CONFIRMED ? new Date() : booking.confirmedAt,
          completedAt: dto.status === BookingStatus.COMPLETED ? new Date() : booking.completedAt,
        },
      });

      if (dto.status === BookingStatus.CANCELLED) {
        await tx.listingAvailability.updateMany({
          where: { bookingId: booking.id },
          data: { isBlocked: false, reason: 'Booking cancelled' },
        });
      }

      return row;
    });

    const targetUserId = actorId === booking.ownerId ? booking.renterId : booking.ownerId;
    await this.notifications.sendMulti({
      userId: targetUserId,
      category: 'booking',
      title: `Booking ${dto.status.toLowerCase()}`,
      body: `Booking ${booking.code} is now ${dto.status.replace('_', ' ').toLowerCase()}.`,
      data: { bookingId: booking.id, status: dto.status },
      url: `/bookings/${booking.id}`,
      channels: [ChannelType.EMAIL, ChannelType.PUSH, ChannelType.IN_APP],
    });

    return updated;
  }

  private async listByWhere(where: Prisma.BookingWhereInput, cursor?: string, limit = 20) {
    const take = Math.min(limit, 100);
    const rows = await this.prisma.booking.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, city: true, price: true } },
        renter: { select: { id: true, profile: { select: { fullName: true } } } },
        owner: { select: { id: true, profile: { select: { fullName: true } } } },
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

  private assertAccess(
    booking: { renterId: string; ownerId: string },
    userId: string,
    role: string,
  ) {
    if (
      booking.renterId === userId ||
      booking.ownerId === userId ||
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.MODERATOR
    ) {
      return;
    }
    throw new ForbiddenException('You do not have access to this booking');
  }

  private assertCanUpdateStatus(
    booking: { renterId: string; ownerId: string },
    actorId: string,
    role: string,
    nextStatus: BookingStatus,
  ) {
    const isAdmin =
      role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MODERATOR;
    const isOwner = booking.ownerId === actorId;
    const isRenter = booking.renterId === actorId;

    if (nextStatus === BookingStatus.CANCELLED) {
      if (!isOwner && !isRenter && !isAdmin) {
        throw new ForbiddenException('Only booking participants can cancel booking');
      }
      return;
    }

    if (nextStatus === BookingStatus.CONFIRMED || nextStatus === BookingStatus.ACTIVE || nextStatus === BookingStatus.COMPLETED) {
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Only owner/admin can apply this status');
      }
      return;
    }

    if (!isAdmin) {
      throw new ForbiddenException('Only admin can set this status');
    }
  }

  private assertStatusTransitionAllowed(currentStatus: BookingStatus, nextStatus: BookingStatus) {
    if (currentStatus === nextStatus) {
      return;
    }

    const transitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.ACTIVE, BookingStatus.CANCELLED],
      [BookingStatus.ACTIVE]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.EXPIRED]: [],
      [BookingStatus.REFUNDED]: [],
    };

    if (!transitions[currentStatus]?.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid booking status transition: ${currentStatus} -> ${nextStatus}`,
      );
    }
  }

  private computeUnits(start: Date, end: Date, period: RentPeriod) {
    const ms = end.getTime() - start.getTime();
    const hours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
    const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));

    switch (period) {
      case RentPeriod.HOURLY:
        return hours;
      case RentPeriod.DAILY:
        return days;
      case RentPeriod.WEEKLY:
        return Math.max(1, Math.ceil(days / 7));
      case RentPeriod.MONTHLY:
        return Math.max(1, Math.ceil(days / 30));
      case RentPeriod.YEARLY:
        return Math.max(1, Math.ceil(days / 365));
      default:
        return days;
    }
  }

  private generateBookingCode() {
    const year = new Date().getFullYear();
    const suffix = `${Date.now()}`.slice(-6);
    return `BK-${year}-${suffix}`;
  }

  private buildCreatedAtRange(createdFrom?: string, createdTo?: string) {
    const from = createdFrom ? new Date(createdFrom) : null;
    const to = createdTo ? new Date(createdTo) : null;

    if (createdFrom && (!from || Number.isNaN(from.getTime()))) {
      throw new BadRequestException('Invalid createdFrom date');
    }

    if (createdTo && (!to || Number.isNaN(to.getTime()))) {
      throw new BadRequestException('Invalid createdTo date');
    }

    const validFrom = from && !Number.isNaN(from.getTime()) ? from : null;
    const validTo = to && !Number.isNaN(to.getTime()) ? to : null;

    if (!validFrom && !validTo) {
      return undefined;
    }

    if (validTo) {
      validTo.setHours(23, 59, 59, 999);
    }

    if (validFrom && validTo && validFrom.getTime() > validTo.getTime()) {
      throw new BadRequestException('createdFrom must be before or equal to createdTo');
    }

    return {
      ...(validFrom ? { gte: validFrom } : {}),
      ...(validTo ? { lte: validTo } : {}),
    } as Prisma.DateTimeFilter;
  }
}
