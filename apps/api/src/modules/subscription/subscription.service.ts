import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  SubscriptionStatus,
  UserRole,
} from '@rentage/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CancelSubscriptionDto, CreateSubscriptionDto } from './dto';
import { RazorpayService } from './razorpay.service';

type EffectivePlanResult = {
  plan: {
    id: string;
    name: string;
    audience: 'OWNER' | 'RENTER' | 'AGENCY';
    maxListings: number;
    maxContactReveals: number;
    maxBookingsPerMonth: number;
    maxInquiriesPerMonth: number;
  } | null;
  source: 'subscription' | 'default_plan' | 'none';
};

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  async listPublicPlans(audience?: string) {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
        isPublic: true,
        ...(audience ? { audience: audience as any } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return plans;
  }

  async getMySubscription(userId: string) {
    return this.prisma.userSubscription.findUnique({
      where: { userId },
      include: {
        plan: true,
      },
    });
  }

  async getMyUsage(userId: string) {
    const [currentSubscription, effectivePlan, listingUsage, contactRevealUsage, bookingUsage] = await Promise.all([
      this.getMySubscription(userId),
      this.getEffectivePlanForUser(userId),
      this.prisma.listing.count({
        where: {
          ownerId: userId,
          status: {
            in: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'BOOKED'],
          },
        },
      }),
      this.prisma.contactReveal.count({
        where: {
          revealerId: userId,
          createdAt: {
            gte: this.getCurrentMonthRange().start,
            lt: this.getCurrentMonthRange().end,
          },
        },
      }),
      this.prisma.booking.count({
        where: {
          renterId: userId,
          createdAt: {
            gte: this.getCurrentMonthRange().start,
            lt: this.getCurrentMonthRange().end,
          },
          status: {
            notIn: ['CANCELLED', 'REFUNDED', 'EXPIRED'],
          },
        },
      }),
    ]);

    return {
      subscription: currentSubscription,
      effectivePlan,
      usage: {
        listings: {
          used: listingUsage,
          limit: effectivePlan.plan?.maxListings ?? null,
        },
        contactReveals: {
          used: contactRevealUsage,
          limit: effectivePlan.plan?.maxContactReveals ?? null,
        },
        bookingsThisMonth: {
          used: bookingUsage,
          limit: effectivePlan.plan?.maxBookingsPerMonth ?? null,
        },
        inquiriesThisMonth: {
          used: await this.prisma.inquiry.count({
            where: {
              renterId: userId,
              createdAt: {
                gte: this.getCurrentMonthRange().start,
                lt: this.getCurrentMonthRange().end,
              },
            },
          }),
          limit: effectivePlan.plan?.maxInquiriesPerMonth ?? null,
        },
      },
    };
  }

  async assertListingCreationAllowed(ownerId: string) {
    const effectivePlan = await this.getEffectivePlanForUser(ownerId);
    const limit = effectivePlan.plan?.maxListings;

    if (!limit || limit <= 0) {
      return;
    }

    const used = await this.prisma.listing.count({
      where: {
        ownerId,
        status: {
          not: 'ARCHIVED',
        },
      },
    });

    if (used >= limit) {
      throw new ForbiddenException(
        `Listing limit reached (${used}/${limit}). Upgrade your subscription to create more listings.`,
      );
    }
  }

  async assertListingActivationAllowed(ownerId: string, listingId?: string) {
    const effectivePlan = await this.getEffectivePlanForUser(ownerId);
    const limit = effectivePlan.plan?.maxListings;

    if (!limit || limit <= 0) {
      return;
    }

    const activeCount = await this.prisma.listing.count({
      where: {
        ownerId,
        status: 'ACTIVE',
        ...(listingId ? { id: { not: listingId } } : {}),
      },
    });

    if (activeCount >= limit) {
      throw new ForbiddenException(
        `Active listing limit reached (${activeCount}/${limit}). Pause one of your active listings or upgrade your plan.`,
      );
    }
  }

  async enforceOwnerActiveListingLimit(ownerId: string) {
    const effectivePlan = await this.getEffectivePlanForUser(ownerId);
    const limit = effectivePlan.plan?.maxListings;

    if (!limit || limit <= 0) {
      return { limit: limit ?? null, pausedIds: [] as string[] };
    }

    const activeListings = await this.prisma.listing.findMany({
      where: {
        ownerId,
        status: 'ACTIVE',
      },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    if (activeListings.length <= limit) {
      return { limit, pausedIds: [] as string[] };
    }

    const keepIds = new Set(activeListings.slice(0, limit).map((listing) => listing.id));
    const pausedIds = activeListings
      .filter((listing) => !keepIds.has(listing.id))
      .map((listing) => listing.id);

    if (pausedIds.length > 0) {
      await this.prisma.listing.updateMany({
        where: {
          ownerId,
          id: { in: pausedIds },
          status: 'ACTIVE',
        },
        data: {
          status: 'PAUSED',
        },
      });
    }

    return { limit, pausedIds };
  }

  async assertContactRevealAllowed(userId: string) {
    const effectivePlan = await this.getEffectivePlanForUser(userId);
    const limit = effectivePlan.plan?.maxContactReveals;

    if (!limit || limit <= 0) {
      return;
    }

    const range = this.getCurrentMonthRange();
    const used = await this.prisma.contactReveal.count({
      where: {
        revealerId: userId,
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
      },
    });

    if (used >= limit) {
      throw new ForbiddenException(
        `Monthly contact reveal limit reached (${used}/${limit}). Upgrade your subscription to reveal more contacts.`,
      );
    }
  }

  async assertBookingCreationAllowed(userId: string) {
    const effectivePlan = await this.getEffectivePlanForUser(userId);
    const limit = effectivePlan.plan?.maxBookingsPerMonth;

    if (!limit || limit <= 0) {
      return;
    }

    const range = this.getCurrentMonthRange();
    const used = await this.prisma.booking.count({
      where: {
        renterId: userId,
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED', 'EXPIRED'],
        },
      },
    });

    if (used >= limit) {
      throw new ForbiddenException(
        `Monthly booking limit reached (${used}/${limit}). Upgrade your subscription to create more bookings.`,
      );
    }
  }

  async assertInquiryCreationAllowed(userId: string) {
    const effectivePlan = await this.getEffectivePlanForUser(userId);
    const limit = effectivePlan.plan?.maxInquiriesPerMonth;

    if (!limit || limit <= 0) {
      return;
    }

    const range = this.getCurrentMonthRange();
    const used = await this.prisma.inquiry.count({
      where: {
        renterId: userId,
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
      },
    });

    if (used >= limit) {
      throw new ForbiddenException(
        `Monthly inquiry limit reached (${used}/${limit}). Upgrade your subscription to create more inquiries.`,
      );
    }
  }

  async create(userId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Subscription plan not found or inactive');
    }

    const existing = await this.prisma.userSubscription.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (
      existing &&
      [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE].includes(
        existing.status as SubscriptionStatus,
      )
    ) {
      throw new BadRequestException('You already have an active subscription');
    }

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, plan.interval);

    const gatewaySubscription = plan.razorpayPlanId
      ? await this.razorpay.createSubscription({
          planId: plan.razorpayPlanId,
          totalCount: this.defaultTotalCount(plan.interval),
          notes: {
            userId,
            planId: plan.id,
          },
        })
      : null;

    const subscription = await this.prisma.userSubscription.upsert({
      where: { userId },
      update: {
        planId: plan.id,
        status: gatewaySubscription ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.ACTIVE,
        razorpaySubId: gatewaySubscription?.id || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: plan.trialDays > 0 ? this.addDays(now, plan.trialDays) : null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      },
      create: {
        userId,
        planId: plan.id,
        status: gatewaySubscription ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.ACTIVE,
        razorpaySubId: gatewaySubscription?.id || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: plan.trialDays > 0 ? this.addDays(now, plan.trialDays) : null,
      },
      include: {
        plan: true,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency,
        status: gatewaySubscription ? PaymentStatus.PENDING : PaymentStatus.CAPTURED,
        description: `Subscription purchase for ${plan.name}`,
        paidAt: gatewaySubscription ? null : now,
        metadata: {
          gateway: gatewaySubscription ? 'razorpay' : 'local',
          razorpaySubscriptionId: gatewaySubscription?.id || null,
          couponCode: dto.couponCode || null,
          successUrl: dto.successUrl || null,
          cancelUrl: dto.cancelUrl || null,
        },
      },
    });

    await this.enforceOwnerActiveListingLimit(userId);

    return {
      subscription,
      payment,
      checkout: gatewaySubscription
        ? {
            gateway: 'razorpay',
            subscriptionId: gatewaySubscription.id,
            status: gatewaySubscription.status,
            shortUrl: gatewaySubscription.short_url || null,
          }
        : {
            gateway: 'local',
            message: 'Razorpay plan not configured. Activated locally for development.',
          },
    };
  }

  async cancel(userId: string, dto: CancelSubscriptionDto) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription already cancelled');
    }

    const atPeriodEnd = dto.atPeriodEnd ?? true;

    if (subscription.razorpaySubId) {
      await this.razorpay.cancelSubscription(subscription.razorpaySubId, atPeriodEnd);
    }

    const updated = await this.prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        ...(atPeriodEnd
          ? {}
          : {
              status: SubscriptionStatus.CANCELLED,
              cancelledAt: new Date(),
            }),
      },
      include: { plan: true },
    });

    await this.enforceOwnerActiveListingLimit(userId);

    return {
      message: atPeriodEnd
        ? 'Subscription will be cancelled at end of current billing cycle'
        : 'Subscription cancelled immediately',
      subscription: updated,
    };
  }

  async handleWebhook(payload: any, signature?: string) {
    const isValid = this.razorpay.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    const event = payload?.event as string | undefined;
    if (!event) {
      throw new BadRequestException('Webhook event missing');
    }

    switch (event) {
      case 'subscription.activated':
      case 'subscription.charged':
        await this.markSubscriptionActive(payload?.payload?.subscription?.entity);
        break;
      case 'subscription.cancelled':
        await this.markSubscriptionCancelled(payload?.payload?.subscription?.entity);
        break;
      case 'subscription.completed':
        await this.markSubscriptionExpired(payload?.payload?.subscription?.entity);
        break;
      case 'payment.captured':
        await this.markPaymentCaptured(payload?.payload?.payment?.entity);
        break;
      case 'payment.failed':
        await this.markPaymentFailed(payload?.payload?.payment?.entity);
        break;
      default:
        break;
    }

    return { received: true, event };
  }

  private async markSubscriptionActive(entity?: any) {
    const subId = entity?.id;
    if (!subId) return;

    await this.prisma.userSubscription.updateMany({
      where: { razorpaySubId: subId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: this.fromUnixSeconds(entity?.current_start) || new Date(),
        currentPeriodEnd:
          this.fromUnixSeconds(entity?.current_end) || this.calculatePeriodEnd(new Date(), 'monthly'),
      },
    });
  }

  private async markSubscriptionCancelled(entity?: any) {
    const subId = entity?.id;
    if (!subId) return;

    await this.prisma.userSubscription.updateMany({
      where: { razorpaySubId: subId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  private async markSubscriptionExpired(entity?: any) {
    const subId = entity?.id;
    if (!subId) return;

    await this.prisma.userSubscription.updateMany({
      where: { razorpaySubId: subId },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });
  }

  private async markPaymentCaptured(entity?: any) {
    const paymentId = entity?.id;
    if (!paymentId) return;

    const linkedSubscription = entity?.subscription_id
      ? await this.prisma.userSubscription.findFirst({
          where: { razorpaySubId: entity.subscription_id },
          select: { id: true, userId: true },
        })
      : null;

    const userId = entity?.notes?.userId || linkedSubscription?.userId;
    if (!userId) {
      return;
    }

    await this.prisma.payment.upsert({
      where: { razorpayPaymentId: paymentId },
      update: {
        status: PaymentStatus.CAPTURED,
        amount: Number(entity?.amount || 0) / 100,
        currency: entity?.currency || 'INR',
        method: entity?.method || null,
        razorpayOrderId: entity?.order_id || null,
        paidAt: this.fromUnixSeconds(entity?.captured_at) || new Date(),
      },
      create: {
        userId,
        subscriptionId: linkedSubscription?.id || null,
        razorpayPaymentId: paymentId,
        razorpayOrderId: entity?.order_id || null,
        amount: Number(entity?.amount || 0) / 100,
        currency: entity?.currency || 'INR',
        status: PaymentStatus.CAPTURED,
        method: entity?.method || null,
        description: 'Payment captured from Razorpay webhook',
        paidAt: this.fromUnixSeconds(entity?.captured_at) || new Date(),
        metadata: entity,
      },
    });
  }

  private async markPaymentFailed(entity?: any) {
    const paymentId = entity?.id;
    if (!paymentId) return;

    await this.prisma.payment.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: entity?.error_description || entity?.error_reason || 'Payment failed',
      },
    });
  }

  private calculatePeriodEnd(start: Date, interval: string) {
    const end = new Date(start);

    switch (interval) {
      case 'yearly':
        end.setMonth(end.getMonth() + 12);
        break;
      case 'quarterly':
        end.setMonth(end.getMonth() + 3);
        break;
      default:
        end.setMonth(end.getMonth() + 1);
        break;
    }

    return end;
  }

  private addDays(input: Date, days: number) {
    const date = new Date(input);
    date.setDate(date.getDate() + days);
    return date;
  }

  private defaultTotalCount(interval: string) {
    switch (interval) {
      case 'yearly':
        return 3;
      case 'quarterly':
        return 8;
      default:
        return 12;
    }
  }

  private fromUnixSeconds(value?: number) {
    if (!value || Number.isNaN(value)) {
      return undefined;
    }

    return new Date(value * 1000);
  }

  private async getEffectivePlanForUser(userId: string): Promise<EffectivePlanResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                audience: true,
                maxListings: true,
                maxContactReveals: true,
                maxBookingsPerMonth: true,
                maxInquiriesPerMonth: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { plan: null, source: 'none' };
    }

    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.MODERATOR
    ) {
      return { plan: null, source: 'none' };
    }

    if (
      user.subscription?.plan &&
      [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE].includes(
        user.subscription.status as SubscriptionStatus,
      )
    ) {
      return { plan: user.subscription.plan, source: 'subscription' };
    }

    const audience = this.mapRoleToAudience(user.role as UserRole);

    const defaultPlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        isActive: true,
        isPublic: true,
        audience,
      },
      select: {
        id: true,
        name: true,
        audience: true,
        maxListings: true,
        maxContactReveals: true,
        maxBookingsPerMonth: true,
        maxInquiriesPerMonth: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }, { createdAt: 'asc' }],
    });

    if (!defaultPlan) {
      return { plan: null, source: 'none' };
    }

    return { plan: defaultPlan, source: 'default_plan' };
  }

  private mapRoleToAudience(role: UserRole) {
    if ([UserRole.OWNER, UserRole.AGENT].includes(role)) {
      return 'OWNER' as const;
    }

    if (role === UserRole.AGENCY_ADMIN) {
      return 'AGENCY' as const;
    }

    return 'RENTER' as const;
  }

  private getCurrentMonthRange() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    return { start, end };
  }
}
