import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── HELPERS ──────────────────────────────────────

  private async logAction(adminId: string, action: string, entity: string, entityId: string, details?: any) {
    await this.prisma.adminLog.create({
      data: { adminId, action, entity, entityId, details: details || undefined },
    });
  }

  // ─── DASHBOARD STATS ─────────────────────────────

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalOwners,
      totalRenters,
      activeUsers,
      totalListings,
      activeListings,
      pendingListings,
      rejectedListings,
      featuredListings,
      newListingsThisMonth,
      totalCategories,
      totalConversations,
      totalMessages,
      totalReportsPending,
      totalPayments,
      revenueResult,
      activeSubscriptions,
      totalPlans,
      planRows,
      subscribedUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { role: 'OWNER' } }),
      this.prisma.user.count({ where: { role: 'RENTER' } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.listing.count({ where: { status: 'REJECTED' } }),
      this.prisma.listing.count({ where: { isFeatured: true } }),
      this.prisma.listing.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'CAPTURED' } }),
      this.prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
      this.prisma.userSubscription.count({
        where: { status: 'ACTIVE' as any },
      }),
      this.prisma.subscriptionPlan.count({ where: { isActive: true } }),
      this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          maxListings: true,
          maxContactReveals: true,
          _count: { select: { subscriptions: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.userSubscription.findMany({
        where: { status: 'ACTIVE' as any },
        select: {
          userId: true,
          planId: true,
          plan: {
            select: {
              name: true,
              maxListings: true,
              maxContactReveals: true,
            },
          },
        },
      }),
    ]);

    const subscribedUserIds = subscribedUsers.map((s) => s.userId);
    let planUtilization: {
      planId: string;
      planName: string;
      subscribers: number;
      avgListingsUsagePct: number;
      avgContactRevealUsagePct: number;
      avgBookingsUsagePct: number;
      avgInquiriesUsagePct: number;
    }[] = [];
    let quotaBreaches = {
      listings: 0,
      contactReveals: 0,
      bookings: 0,
      inquiries: 0,
    };

    if (subscribedUserIds.length > 0) {
      const usageByUser = await Promise.all(
        subscribedUsers.map(async (sub) => {
          const [listingsUsed, revealsUsed] = await Promise.all([
            this.prisma.listing.count({
              where: {
                ownerId: sub.userId,
                status: { in: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'REJECTED'] as any },
              },
            }),
            this.prisma.contactReveal.count({
              where: {
                revealerId: sub.userId,
                createdAt: { gte: monthStart, lt: monthEnd },
              },
            }),
          ]);

          return {
            userId: sub.userId,
            planId: sub.planId,
            listingsUsed,
            revealsUsed,
            listingsLimit: sub.plan.maxListings,
            revealsLimit: sub.plan.maxContactReveals,
          };
        }),
      );

      const aggByPlan: Record<
        string,
        {
          subscribers: number;
          listingsPctSum: number;
          listingsPctCount: number;
          revealsPctSum: number;
          revealsPctCount: number;
          bookingsPctSum: number;
          bookingsPctCount: number;
          inquiriesPctSum: number;
          inquiriesPctCount: number;
        }
      > = {};

      for (const row of usageByUser) {
        const limits = {
          listings: row.listingsLimit,
          reveals: row.revealsLimit,
        };

        if (!aggByPlan[row.planId]) {
          aggByPlan[row.planId] = {
            subscribers: 0,
            listingsPctSum: 0,
            listingsPctCount: 0,
            revealsPctSum: 0,
            revealsPctCount: 0,
            bookingsPctSum: 0,
            bookingsPctCount: 0,
            inquiriesPctSum: 0,
            inquiriesPctCount: 0,
          };
        }

        const bucket = aggByPlan[row.planId];
        bucket.subscribers += 1;

        if (limits.listings > 0) {
          bucket.listingsPctSum += (row.listingsUsed / limits.listings) * 100;
          bucket.listingsPctCount += 1;
          if (row.listingsUsed >= limits.listings) quotaBreaches.listings += 1;
        }

        if (limits.reveals > 0) {
          bucket.revealsPctSum += (row.revealsUsed / limits.reveals) * 100;
          bucket.revealsPctCount += 1;
          if (row.revealsUsed >= limits.reveals) quotaBreaches.contactReveals += 1;
        }
      }

      planUtilization = planRows.map((plan) => {
        const bucket = aggByPlan[plan.id];
        return {
          planId: plan.id,
          planName: plan.name,
          subscribers: plan._count.subscriptions,
          avgListingsUsagePct: bucket?.listingsPctCount
            ? Number((bucket.listingsPctSum / bucket.listingsPctCount).toFixed(1))
            : 0,
          avgContactRevealUsagePct: bucket?.revealsPctCount
            ? Number((bucket.revealsPctSum / bucket.revealsPctCount).toFixed(1))
            : 0,
          avgBookingsUsagePct: bucket?.bookingsPctCount
            ? Number((bucket.bookingsPctSum / bucket.bookingsPctCount).toFixed(1))
            : 0,
          avgInquiriesUsagePct: bucket?.inquiriesPctCount
            ? Number((bucket.inquiriesPctSum / bucket.inquiriesPctCount).toFixed(1))
            : 0,
        };
      });
    }

    // Category breakdown
    const categoryBreakdown = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: { name: true, _count: { select: { listings: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    // Role breakdown for users
    const roleBreakdown = [
      { role: 'OWNER', count: totalOwners },
      { role: 'RENTER', count: totalRenters },
      { role: 'ADMIN', count: totalUsers - totalOwners - totalRenters },
    ];

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: newUsersThisWeek,
        roleBreakdown,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        pending: pendingListings,
        rejected: rejectedListings,
        featured: featuredListings,
        newThisMonth: newListingsThisMonth,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          name: c.name,
          count: c._count.listings,
        })),
      },
      engagement: {
        totalConversations,
        totalMessages,
        pendingReports: totalReportsPending,
      },
      revenue: {
        totalPayments,
        totalRevenue: revenueResult._sum.amount || 0,
      },
      subscription: {
        activeSubscriptions,
        totalPlans,
        planUtilization,
        quotaBreaches,
      },
      categories: totalCategories,
    };
  }

  async getChartData(period: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily user signups
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    // Get daily listing creations
    const listings = await this.prisma.listing.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap: Record<string, { users: number; owners: number; renters: number; listings: number }> = {};
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dateMap[key] = { users: 0, owners: 0, renters: 0, listings: 0 };
    }

    users.forEach((u) => {
      const key = u.createdAt.toISOString().split('T')[0];
      if (dateMap[key]) {
        dateMap[key].users++;
        if (u.role === 'OWNER') dateMap[key].owners++;
        if (u.role === 'RENTER') dateMap[key].renters++;
      }
    });

    listings.forEach((l) => {
      const key = l.createdAt.toISOString().split('T')[0];
      if (dateMap[key]) dateMap[key].listings++;
    });

    return {
      period,
      data: Object.entries(dateMap).map(([date, counts]) => ({
        date,
        ...counts,
      })),
    };
  }

  async getRecentActivity() {
    const [recentUsers, recentListings, recentReports, recentLogs] = await Promise.all([
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, role: true, createdAt: true,
          profile: { select: { fullName: true } },
        },
      }),
      this.prisma.listing.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, status: true, createdAt: true, price: true, rentPeriod: true,
          category: { select: { name: true } },
          owner: { select: { profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.report.findMany({
        take: 5,
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, reason: true, createdAt: true,
          reporter: { select: { profile: { select: { fullName: true } } } },
          listing: { select: { id: true, title: true } },
        },
      }),
      this.prisma.adminLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, action: true, entity: true, entityId: true, createdAt: true,
          admin: { select: { profile: { select: { fullName: true } } } },
        },
      }),
    ]);

    return { recentUsers, recentListings, recentReports, recentLogs };
  }

  // ─── USER MANAGEMENT ─────────────────────────────

  async getUsers(params: {
    page: number; limit: number; search?: string; role?: string; status?: string; sort?: string;
  }) {
    const { page, limit, search, role, status, sort } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { profile: { fullName: { contains: search } } },
        { profile: { phone: { contains: search } } },
      ];
    }
    if (role) where.role = role as any;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sort === 'email' ? { email: 'asc' } :
      sort === 'oldest' ? { createdAt: 'asc' } :
      { createdAt: 'desc' };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true, email: true, role: true, isActive: true, isEmailVerified: true, createdAt: true,
          profile: { select: { fullName: true, phone: true, avatarUrl: true, city: true, state: true } },
          _count: { select: { ownedListings: true, savedListings: true, sentMessages: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, role: true, isActive: true, isEmailVerified: true, createdAt: true, updatedAt: true,
        profile: true,
        subscription: { include: { plan: true } },
        _count: {
          select: {
            ownedListings: true, savedListings: true, sentMessages: true,
            conversationsAsOwner: true, conversationsAsRenter: true, payments: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Get recent listings if owner
    const recentListings = user.role === 'OWNER'
      ? await this.prisma.listing.findMany({
          where: { ownerId: id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, title: true, status: true, price: true, rentPeriod: true, createdAt: true,
            category: { select: { name: true } },
            images: { take: 1, select: { url: true } },
          },
        })
      : [];

    // Get recent payments
    const recentPayments = await this.prisma.payment.findMany({
      where: { userId: id },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return { ...user, recentListings, recentPayments };
  }

  async toggleUserActive(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') throw new BadRequestException('Cannot deactivate admin users');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });

    await this.logAction(adminId, updated.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'USER', id, { email: user.email });
    return updated;
  }

  async changeUserRole(id: string, role: string, adminId: string) {
    if (!['OWNER', 'RENTER'].includes(role)) throw new BadRequestException('Invalid role');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') throw new BadRequestException('Cannot change admin role');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, email: true, role: true },
    });

    await this.logAction(adminId, 'CHANGE_ROLE', 'USER', id, { from: user.role, to: role, email: user.email });
    return updated;
  }

  // ─── LISTING MODERATION ───────────────────────────

  async getListings(params: {
    page: number; limit: number; status?: string; categoryId?: string; search?: string; sort?: string;
  }) {
    const { page, limit, status, categoryId, search, sort } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {};
    if (status) where.status = status as any;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      sort === 'price_asc' ? { price: 'asc' } :
      sort === 'price_desc' ? { price: 'desc' } :
      sort === 'oldest' ? { createdAt: 'asc' } :
      { createdAt: 'desc' };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true, title: true, price: true, rentPeriod: true, status: true,
          isFeatured: true, city: true, state: true, createdAt: true,
          rejectionReason: true,
          category: { select: { id: true, name: true } },
          owner: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
          images: { take: 1, select: { url: true } },
          _count: { select: { conversations: true, savedBy: true, reports: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveListing(id: string, adminId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: 'ACTIVE', rejectionReason: null },
    });

    await this.logAction(adminId, 'APPROVE_LISTING', 'LISTING', id, { title: listing.title });
    return updated;
  }

  async rejectListing(id: string, reason: string, adminId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    await this.logAction(adminId, 'REJECT_LISTING', 'LISTING', id, { title: listing.title, reason });
    return updated;
  }

  async toggleFeatured(id: string, adminId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { isFeatured: !listing.isFeatured },
    });

    await this.logAction(adminId, listing.isFeatured ? 'UNFEATURE_LISTING' : 'FEATURE_LISTING', 'LISTING', id, { title: listing.title });
    return updated;
  }

  async removeListing(id: string, reason: string, adminId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id }, select: { id: true, title: true, ownerId: true } });
    if (!listing) throw new NotFoundException('Listing not found');

    await this.prisma.listing.delete({ where: { id } });
    await this.logAction(adminId, 'REMOVE_LISTING', 'LISTING', id, { title: listing.title, reason });

    return { message: 'Listing removed' };
  }

  // ─── CATEGORY MANAGEMENT ─────────────────────────

  async getCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: { _count: { select: { listings: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { listings: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(data: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number }, adminId: string) {
    const existing = await this.prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('Category slug already exists');

    const category = await this.prisma.category.create({ data });
    await this.logAction(adminId, 'CREATE_CATEGORY', 'CATEGORY', category.id, { name: data.name });
    return category;
  }

  async updateCategory(id: string, data: any, adminId: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const updated = await this.prisma.category.update({ where: { id }, data });
    await this.logAction(adminId, 'UPDATE_CATEGORY', 'CATEGORY', id, { name: category.name, changes: data });
    return updated;
  }

  async deleteCategory(id: string, adminId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { listings: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.listings > 0) {
      throw new BadRequestException(`Cannot delete category with ${category._count.listings} listings. Reassign them first.`);
    }

    await this.prisma.category.delete({ where: { id } });
    await this.logAction(adminId, 'DELETE_CATEGORY', 'CATEGORY', id, { name: category.name });
    return { message: 'Category deleted' };
  }

  // ─── SUBSCRIPTION PLANS ──────────────────────────

  async getPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return plans;
  }

  async createPlan(data: any, adminId: string) {
    const plan = await this.prisma.subscriptionPlan.create({ data });
    await this.logAction(adminId, 'CREATE_PLAN', 'PLAN', plan.id, { name: data.name, price: data.price });
    return plan;
  }

  async updatePlan(id: string, data: any, adminId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const updated = await this.prisma.subscriptionPlan.update({ where: { id }, data });
    await this.logAction(adminId, 'UPDATE_PLAN', 'PLAN', id, { name: plan.name, changes: data });
    return updated;
  }

  async deletePlan(id: string, adminId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(`Cannot delete plan with ${plan._count.subscriptions} active subscriptions`);
    }

    await this.prisma.subscriptionPlan.delete({ where: { id } });
    await this.logAction(adminId, 'DELETE_PLAN', 'PLAN', id, { name: plan.name });
    return { message: 'Plan deleted' };
  }

  // ─── BANNER MANAGEMENT ─────────────────────────

  async getBanners() {
    return this.prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createBanner(
    data: { title?: string; imageUrl: string; linkUrl?: string; sortOrder?: number; isActive?: boolean },
    adminId: string,
  ) {
    if (!data.imageUrl?.trim()) {
      throw new BadRequestException('imageUrl is required');
    }

    const banner = await this.prisma.banner.create({
      data: {
        title: data.title?.trim() || null,
        imageUrl: data.imageUrl.trim(),
        linkUrl: data.linkUrl?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    await this.logAction(adminId, 'CREATE_BANNER', 'BANNER', banner.id, {
      imageUrl: banner.imageUrl,
      title: banner.title,
    });

    return banner;
  }

  async updateBanner(
    id: string,
    data: { title?: string; imageUrl?: string; linkUrl?: string; sortOrder?: number; isActive?: boolean },
    adminId: string,
  ) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    const payload = {
      ...(data.title !== undefined ? { title: data.title?.trim() || null } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl.trim() } : {}),
      ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl?.trim() || null } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    if ('imageUrl' in payload && !payload.imageUrl) {
      throw new BadRequestException('imageUrl cannot be empty');
    }

    const updated = await this.prisma.banner.update({ where: { id }, data: payload });
    await this.logAction(adminId, 'UPDATE_BANNER', 'BANNER', id, { changes: payload });
    return updated;
  }

  async deleteBanner(id: string, adminId: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    await this.prisma.banner.delete({ where: { id } });
    await this.logAction(adminId, 'DELETE_BANNER', 'BANNER', id, { imageUrl: banner.imageUrl });
    return { message: 'Banner deleted' };
  }

  // ─── REPORTS ──────────────────────────────────────

  async getReports(params: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};
    if (status) where.status = status as any;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
          listing: {
            select: {
              id: true, title: true, status: true,
              images: { take: 1, select: { url: true } },
              owner: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
            },
          },
          resolvedBy: { select: { profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async resolveReport(id: string, action: string, adminNotes: string | undefined, adminId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { listing: { select: { id: true, title: true } } },
    });
    if (!report) throw new NotFoundException('Report not found');

    // If action is 'remove_listing', also remove the listing
    if (action === 'remove_listing') {
      await this.prisma.listing.update({
        where: { id: report.listingId },
        data: { status: 'INACTIVE' },
      });
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedById: adminId, resolvedAt: new Date(), adminNotes },
    });

    await this.logAction(adminId, 'RESOLVE_REPORT', 'REPORT', id, { action, listingTitle: report.listing.title });
    return updated;
  }

  async dismissReport(id: string, adminNotes: string | undefined, adminId: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: 'DISMISSED', resolvedById: adminId, resolvedAt: new Date(), adminNotes },
    });

    await this.logAction(adminId, 'DISMISS_REPORT', 'REPORT', id);
    return updated;
  }

  // ─── AUDIT LOG ────────────────────────────────────

  async getAuditLog(params: { page: number; limit: number; action?: string; entity?: string }) {
    const { page, limit, action, entity } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AdminLogWhereInput = {};
    if (action) where.action = { contains: action };
    if (entity) where.entity = entity;

    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { email: true, profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.adminLog.count({ where }),
    ]);

    return {
      logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
