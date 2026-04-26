import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BookingStatus,
  PaymentStatus,
  ChannelType,
  InquiryActivityType,
  InquiryStatus,
  ListingStatus,
  UserRole,
} from '@rentage/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionService } from '../subscription/subscription.service';
import {
  AddInquiryNoteDto,
  AssignInquiryDto,
  ConvertInquiryToBookingDto,
  CreateInquiryDto,
  UpdateInquiryStatusDto,
} from './dto';

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(renterId: string, dto: CreateInquiryDto) {
    await this.subscriptionService.assertInquiryCreationAllowed(renterId);

    if (dto.budgetMin && dto.budgetMax && dto.budgetMin > dto.budgetMax) {
      throw new BadRequestException('budgetMin cannot be greater than budgetMax');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: {
        id: true,
        ownerId: true,
        orgId: true,
        status: true,
        title: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Inquiry can only be created for active listings');
    }

    if (listing.ownerId === renterId) {
      throw new ForbiddenException('You cannot create inquiry on your own listing');
    }

    const existingOpen = await this.prisma.inquiry.findFirst({
      where: {
        listingId: dto.listingId,
        renterId,
        status: {
          notIn: [InquiryStatus.CLOSED, InquiryStatus.LOST],
        },
      },
      include: {
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOpen) {
      return existingOpen;
    }

    const inquiry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inquiry.create({
        data: {
          listingId: listing.id,
          ownerId: listing.ownerId,
          renterId,
          orgId: listing.orgId,
          source: dto.source,
          message: dto.message,
          budgetMin: dto.budgetMin,
          budgetMax: dto.budgetMax,
          preferredAt: dto.preferredAt ? new Date(dto.preferredAt) : undefined,
        },
        include: {
          listing: { select: { id: true, title: true } },
          renter: { select: { id: true, profile: { select: { fullName: true } } } },
          owner: { select: { id: true } },
          assignee: { select: { id: true, profile: { select: { fullName: true } } } },
          conversation: true,
        },
      });

      await tx.inquiryActivity.create({
        data: {
          inquiryId: created.id,
          actorId: renterId,
          type: InquiryActivityType.CREATED,
          note: 'Inquiry created',
          data: {
            source: dto.source || 'listing_page',
          },
        },
      });

      await tx.listing.update({
        where: { id: listing.id },
        data: { inquiryCount: { increment: 1 } },
      });

      const existingConversation = await tx.conversation.findUnique({
        where: {
          listingId_renterId: {
            listingId: listing.id,
            renterId,
          },
        },
      });

      if (!existingConversation) {
        await tx.conversation.create({
          data: {
            listingId: listing.id,
            ownerId: listing.ownerId,
            renterId,
            inquiryId: created.id,
          },
        });
      } else if (!existingConversation.inquiryId) {
        await tx.conversation.update({
          where: { id: existingConversation.id },
          data: { inquiryId: created.id },
        });
      }

      return created;
    });

    void this.notifications
      .sendMulti({
        userId: listing.ownerId,
        category: 'inquiry',
        title: 'New inquiry received',
        body: `You received a new inquiry for ${listing.title}.`,
        data: {
          inquiryId: inquiry.id,
          listingId: listing.id,
        },
        channels: [ChannelType.EMAIL, ChannelType.PUSH, ChannelType.IN_APP],
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Failed to send inquiry notifications for inquiry ${inquiry.id}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return this.getById(inquiry.id, renterId, UserRole.RENTER);
  }

  async listForUser(
    userId: string,
    role: string,
    params: {
      status?: InquiryStatus;
      cursor?: string;
      limit?: number;
      scope?: 'renter' | 'owner' | 'assignee';
    },
  ) {
    const limit = Math.min(params.limit || 20, 100);

    const where: Prisma.InquiryWhereInput = {};
    if (params.status) {
      where.status = params.status;
    }

    if (params.scope === 'owner') {
      where.ownerId = userId;
    } else if (params.scope === 'assignee') {
      where.assigneeId = userId;
    } else if (params.scope === 'renter') {
      where.renterId = userId;
    } else {
      // Default scope by role
      where[
        role === UserRole.OWNER || role === UserRole.AGENCY_ADMIN || role === UserRole.AGENT
          ? 'ownerId'
          : 'renterId'
      ] = userId;
    }

    // Admin and moderators can see all by default
    if (
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.MODERATOR
    ) {
      if (!params.scope) {
        delete where.ownerId;
        delete where.renterId;
        delete where.assigneeId;
      }
    }

    const rows = await this.prisma.inquiry.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, city: true, price: true } },
        renter: { select: { id: true, profile: { select: { fullName: true, phone: true } } } },
        owner: { select: { id: true, profile: { select: { fullName: true, phone: true } } } },
        assignee: { select: { id: true, profile: { select: { fullName: true } } } },
        conversation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items,
      meta: {
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    };
  }

  async getById(id: string, userId: string, role: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            price: true,
            rentPeriod: true,
          },
        },
        renter: { select: { id: true, email: true, profile: true } },
        owner: { select: { id: true, email: true, profile: true } },
        assignee: { select: { id: true, email: true, profile: true } },
        conversation: { select: { id: true, lastMessageAt: true } },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    this.assertAccess(inquiry, userId, role);
    return inquiry;
  }

  async updateStatus(
    id: string,
    actorId: string,
    role: string,
    dto: UpdateInquiryStatusDto,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    this.assertCanUpdateStatus(inquiry, actorId, role, dto.status);

    if (!this.isTransitionAllowed(inquiry.status as InquiryStatus, dto.status)) {
      throw new BadRequestException(`Invalid status transition: ${inquiry.status} -> ${dto.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.inquiry.update({
        where: { id },
        data: {
          status: dto.status,
          closedAt:
            dto.status === InquiryStatus.CLOSED || dto.status === InquiryStatus.LOST
              ? new Date()
              : null,
          closedReason:
            dto.status === InquiryStatus.LOST || dto.status === InquiryStatus.CLOSED
              ? dto.note || null
              : null,
        },
      });

      await tx.inquiryActivity.create({
        data: {
          inquiryId: id,
          actorId,
          type:
            dto.status === InquiryStatus.CLOSED || dto.status === InquiryStatus.LOST
              ? InquiryActivityType.CLOSED
              : InquiryActivityType.STATUS_CHANGED,
          note: dto.note,
          data: {
            from: inquiry.status,
            to: dto.status,
          },
        },
      });

      return row;
    });

    return updated;
  }

  async assign(id: string, actorId: string, role: string, dto: AssignInquiryDto) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    if (
      inquiry.ownerId !== actorId &&
      role !== UserRole.ADMIN &&
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException('Only owner/admin can assign this inquiry');
    }

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({ where: { id: dto.assigneeId } });
      if (!assignee) {
        throw new NotFoundException('Assignee user not found');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.inquiry.update({
        where: { id },
        data: { assigneeId: dto.assigneeId || null },
      });

      await tx.inquiryActivity.create({
        data: {
          inquiryId: id,
          actorId,
          type: InquiryActivityType.ASSIGNED,
          data: {
            assigneeId: dto.assigneeId || null,
          },
          note: dto.assigneeId ? 'Inquiry assigned' : 'Inquiry unassigned',
        },
      });

      return row;
    });

    return updated;
  }

  async addNote(id: string, actorId: string, role: string, dto: AddInquiryNoteDto) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    this.assertCanManage(inquiry, actorId, role);

    return this.prisma.inquiryActivity.create({
      data: {
        inquiryId: id,
        actorId,
        type: InquiryActivityType.NOTE_ADDED,
        note: dto.note,
      },
    });
  }

  async listActivities(id: string, userId: string, role: string, cursor?: string, limit = 30) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    this.assertAccess(inquiry, userId, role);

    const take = Math.min(limit, 100);

    const rows = await this.prisma.inquiryActivity.findMany({
      where: { inquiryId: id },
      include: {
        actor: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
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

  async listForOwner(
    ownerId: string,
    filters: {
      status?: InquiryStatus;
      listingId?: string;
      cursor?: string;
      limit?: number;
    } = {},
  ) {
    const take = Math.min(filters.limit || 12, 100);

    const rows = await this.prisma.inquiry.findMany({
      where: {
        ownerId,
        ...(filters.status && { status: filters.status }),
        ...(filters.listingId && { listingId: filters.listingId }),
      },
      include: {
        listing: {
          select: { id: true, title: true, price: true, city: true },
        },
        renter: {
          select: { id: true, email: true, profile: { select: { fullName: true, phone: true } } },
        },
        assignee: {
          select: { id: true, profile: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;

    return {
      data: items,
      meta: {
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    };
  }

  async listForAdmin(
    filters: {
      status?: InquiryStatus;
      listingId?: string;
      ownerId?: string;
      renterId?: string;
      cursor?: string;
      limit?: number;
    } = {},
  ) {
    const take = Math.min(filters.limit || 12, 100);

    const rows = await this.prisma.inquiry.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.listingId && { listingId: filters.listingId }),
        ...(filters.ownerId && { ownerId: filters.ownerId }),
        ...(filters.renterId && { renterId: filters.renterId }),
      },
      include: {
        listing: {
          select: { id: true, title: true, price: true, city: true },
        },
        renter: {
          select: { id: true, email: true, profile: { select: { fullName: true, phone: true } } },
        },
        owner: {
          select: { id: true, email: true, profile: { select: { fullName: true } } },
        },
        assignee: {
          select: { id: true, profile: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;

    return {
      data: items,
      meta: {
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    };
  }

  async convertToBooking(
    inquiryId: string,
    actorId: string,
    role: string,
    dto: ConvertInquiryToBookingDto,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        listing: {
          select: { id: true, title: true, price: true, depositAmount: true, rentPeriod: true },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    this.assertCanConvertToBooking(inquiry, actorId, role);

    if (inquiry.status === InquiryStatus.CONVERTED || inquiry.status === InquiryStatus.CLOSED || inquiry.status === InquiryStatus.LOST) {
      throw new BadRequestException('Cannot convert inquiry with status: ' + inquiry.status);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Valid booking dates are required');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const unitPrice = Number(
      dto.unitPrice ?? inquiry.budgetMax ?? inquiry.budgetMin ?? inquiry.listing.price ?? 0,
    );
    const totalAmount = Number(dto.totalAmount ?? unitPrice);
    const depositAmount = Number(dto.depositAmount ?? inquiry.listing.depositAmount ?? 0);
    const receivedAmount = Number(dto.receivedAmount ?? 0);
    const dueAmount = Number((totalAmount + depositAmount - receivedAmount).toFixed(2));

    if (unitPrice < 0 || totalAmount < 0 || depositAmount < 0 || receivedAmount < 0) {
      throw new BadRequestException('Amounts cannot be negative');
    }
    if (receivedAmount > totalAmount + depositAmount) {
      throw new BadRequestException('receivedAmount cannot exceed total payable amount');
    }

    const overlapping = await this.prisma.listingAvailability.findFirst({
      where: {
        listingId: inquiry.listingId,
        isBlocked: true,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    });

    if (overlapping) {
      throw new BadRequestException('Selected dates are not available');
    }

    // Check if booking already exists
    const existingBooking = await this.prisma.booking.findFirst({
      where: { inquiryId },
    });

    if (existingBooking) {
      return existingBooking;
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const verificationSummary = [
        `Conversion review for inquiry ${inquiryId}`,
        `Listing: ${inquiry.listing.title}`,
        `Booking window: ${startDate.toISOString()} to ${endDate.toISOString()}`,
        `Unit price: ${unitPrice.toFixed(2)}`,
        `Total amount: ${totalAmount.toFixed(2)}`,
        `Deposit amount: ${depositAmount.toFixed(2)}`,
        `Received amount: ${receivedAmount.toFixed(2)}`,
        `Due amount: ${dueAmount.toFixed(2)}`,
        `Payment method: ${dto.paymentMethod || 'Not specified'}`,
        `Required documents: ${(dto.requiredDocuments || []).join(', ') || 'None'}`,
        `Verification notes: ${dto.verificationNotes || 'None'}`,
      ].join('\n');

      const created = await tx.booking.create({
        data: {
          code: `BK-${Date.now()}`,
          listingId: inquiry.listingId,
          renterId: inquiry.renterId,
          ownerId: inquiry.ownerId,
          inquiryId,
          startDate,
          endDate,
          status: BookingStatus.PENDING,
          unitPrice,
          totalAmount,
          depositAmount,
          rentPeriod: inquiry.listing.rentPeriod,
          notes: verificationSummary,
        },
      });

      if (receivedAmount > 0) {
        await tx.payment.create({
          data: {
            userId: inquiry.renterId,
            bookingId: created.id,
            amount: receivedAmount,
            currency: 'INR',
            status: PaymentStatus.CAPTURED,
            method: dto.paymentMethod || 'manual',
            description: `Manual payment recorded during inquiry conversion (${created.code})`,
            paidAt: new Date(),
            metadata: {
              source: 'inquiry_conversion',
              inquiryId,
              dueAmount,
              requiredDocuments: dto.requiredDocuments || [],
              verificationNotes: dto.verificationNotes || '',
            },
          },
        });
      }

      await tx.listingAvailability.create({
        data: {
          listingId: inquiry.listingId,
          startDate,
          endDate,
          isBlocked: true,
          reason: `Booked (${created.code})`,
          bookingId: created.id,
        },
      });

      // Update inquiry status
      await tx.inquiry.update({
        where: { id: inquiryId },
        data: { status: InquiryStatus.CONVERTED },
      });

      // Log activity
      await tx.inquiryActivity.create({
        data: {
          inquiryId,
          actorId,
          type: InquiryActivityType.STATUS_CHANGED,
          note: 'Inquiry converted to booking',
          data: {
            from: inquiry.status,
            to: InquiryStatus.CONVERTED,
            bookingId: created.id,
            startDate: dto.startDate,
            endDate: dto.endDate,
            unitPrice,
            totalAmount,
            depositAmount,
            receivedAmount,
            dueAmount,
            paymentMethod: dto.paymentMethod || null,
            requiredDocuments: dto.requiredDocuments || [],
            verificationNotes: dto.verificationNotes || null,
          },
        },
      });

      return created;
    });

    return booking;
  }

  private assertAccess(
    inquiry: {
      ownerId: string;
      renterId: string;
      assigneeId: string | null;
    },
    userId: string,
    role: string,
  ) {
    if (
      inquiry.ownerId === userId ||
      inquiry.renterId === userId ||
      inquiry.assigneeId === userId ||
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.MODERATOR
    ) {
      return;
    }

    throw new ForbiddenException('You do not have access to this inquiry');
  }

  private assertCanUpdateStatus(
    inquiry: {
      ownerId: string;
      renterId: string;
      assigneeId: string | null;
    },
    userId: string,
    role: string,
    nextStatus: InquiryStatus,
  ) {
    const isAdminLike =
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.MODERATOR ||
      role === UserRole.AGENCY_ADMIN;

    if (isAdminLike || inquiry.ownerId === userId || inquiry.assigneeId === userId) {
      return;
    }

    // Renter can only cancel/close their own inquiry.
    if (
      inquiry.renterId === userId &&
      (nextStatus === InquiryStatus.LOST || nextStatus === InquiryStatus.CLOSED)
    ) {
      return;
    }

    throw new ForbiddenException('Only owner/assignee/admin can update this inquiry');
  }

  private assertCanManage(
    inquiry: {
      ownerId: string;
      assigneeId: string | null;
    },
    userId: string,
    role: string,
  ) {
    if (
      inquiry.ownerId === userId ||
      inquiry.assigneeId === userId ||
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.MODERATOR ||
      role === UserRole.AGENCY_ADMIN
    ) {
      return;
    }

    throw new ForbiddenException('Only owner/assignee/admin can update this inquiry');
  }

  private assertCanConvertToBooking(
    inquiry: { ownerId: string },
    userId: string,
    role: string,
  ) {
    const isAdminLike =
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.MODERATOR ||
      role === UserRole.AGENCY_ADMIN;

    if (inquiry.ownerId === userId || isAdminLike) {
      return;
    }

    throw new ForbiddenException('Only the owner or admin can convert an inquiry to a booking');
  }

  private isTransitionAllowed(from: InquiryStatus, to: InquiryStatus) {
    if (from === to) {
      return true;
    }

    const transitions: Record<InquiryStatus, InquiryStatus[]> = {
      [InquiryStatus.NEW]: [
        InquiryStatus.CONTACTED,
        InquiryStatus.NEGOTIATING,
        InquiryStatus.VISIT_SCHEDULED,
        InquiryStatus.CONVERTED,
        InquiryStatus.LOST,
        InquiryStatus.CLOSED,
      ],
      [InquiryStatus.CONTACTED]: [
        InquiryStatus.NEGOTIATING,
        InquiryStatus.VISIT_SCHEDULED,
        InquiryStatus.CONVERTED,
        InquiryStatus.LOST,
        InquiryStatus.CLOSED,
      ],
      [InquiryStatus.NEGOTIATING]: [
        InquiryStatus.VISIT_SCHEDULED,
        InquiryStatus.CONVERTED,
        InquiryStatus.LOST,
        InquiryStatus.CLOSED,
      ],
      [InquiryStatus.VISIT_SCHEDULED]: [
        InquiryStatus.NEGOTIATING,
        InquiryStatus.CONVERTED,
        InquiryStatus.LOST,
        InquiryStatus.CLOSED,
      ],
      [InquiryStatus.CONVERTED]: [InquiryStatus.CLOSED],
      [InquiryStatus.LOST]: [InquiryStatus.CLOSED],
      [InquiryStatus.CLOSED]: [],
    };

    return transitions[from]?.includes(to) ?? false;
  }
}
