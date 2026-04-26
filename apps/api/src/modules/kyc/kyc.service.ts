import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KycStatus, UserRole } from '@rentage/shared-types';
import { ReviewKycDto, SubmitKycDto } from './dto';

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submit(userId: string, dto: SubmitKycDto) {
    if (!dto.documents?.length) {
      throw new BadRequestException('At least one KYC document is required');
    }

    const activeSubmission = await this.prisma.kycSubmission.findFirst({
      where: {
        userId,
        status: {
          in: [KycStatus.PENDING, KycStatus.IN_REVIEW],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSubmission) {
      throw new BadRequestException('You already have a KYC submission under review');
    }

    const submission = await this.prisma.kycSubmission.create({
      data: {
        userId,
        status: KycStatus.PENDING,
        legalName: dto.legalName,
        documents: {
          createMany: {
            data: dto.documents.map((doc) => ({
              type: doc.type,
              number: doc.number,
              fileUrl: doc.fileUrl,
              filePublicId: doc.filePublicId,
              metadata: doc.metadata as any,
            })),
          },
        },
      },
      include: {
        documents: true,
      },
    });

    return submission;
  }

  async getMine(userId: string) {
    return this.prisma.kycSubmission.findFirst({
      where: { userId },
      include: { documents: true, reviewer: { select: { id: true, profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMine(userId: string, cursor?: string, limit = 20) {
    const take = Math.min(limit, 100);
    const rows = await this.prisma.kycSubmission.findMany({
      where: { userId },
      include: {
        documents: true,
        reviewer: { select: { id: true, profile: { select: { fullName: true } } } },
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

  async listForAdmin(
    role: string,
    params: {
      status?: KycStatus;
      cursor?: string;
      limit?: number;
    },
  ) {
    if (![UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role as UserRole)) {
      throw new BadRequestException('Insufficient role for KYC review');
    }

    const take = Math.min(params.limit || 20, 100);
    const rows = await this.prisma.kycSubmission.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
      },
      include: {
        user: {
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
        reviewer: { select: { id: true, profile: { select: { fullName: true } } } },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
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

  async getByIdForAdmin(id: string, role: string) {
    if (![UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role as UserRole)) {
      throw new BadRequestException('Insufficient role for KYC review');
    }

    const submission = await this.prisma.kycSubmission.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, profile: true } },
        reviewer: { select: { id: true, email: true, profile: true } },
        documents: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('KYC submission not found');
    }

    return submission;
  }

  async review(id: string, reviewerId: string, role: string, dto: ReviewKycDto) {
    if (![UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role as UserRole)) {
      throw new BadRequestException('Insufficient role for KYC review');
    }

    const submission = await this.prisma.kycSubmission.findUnique({ where: { id } });
    if (!submission) {
      throw new NotFoundException('KYC submission not found');
    }

    if (dto.status === KycStatus.REJECTED && !dto.rejectReason) {
      throw new BadRequestException('rejectReason is required when status is REJECTED');
    }

    if (![KycStatus.IN_REVIEW, KycStatus.APPROVED, KycStatus.REJECTED].includes(dto.status)) {
      throw new BadRequestException('Invalid review status for admin action');
    }

    const reviewed = await this.prisma.kycSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        reviewerId,
        reviewedAt: new Date(),
        rejectReason: dto.status === KycStatus.REJECTED ? dto.rejectReason || null : null,
        expiresAt:
          dto.status === KycStatus.APPROVED
            ? dto.expiresAt
              ? new Date(dto.expiresAt)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    await this.notifications.sendMulti({
      userId: reviewed.user.id,
      category: 'kyc',
      title:
        dto.status === KycStatus.APPROVED
          ? 'KYC approved'
          : dto.status === KycStatus.REJECTED
            ? 'KYC rejected'
            : 'KYC is under review',
      body:
        dto.status === KycStatus.APPROVED
          ? 'Your KYC submission has been approved.'
          : dto.status === KycStatus.REJECTED
            ? `Your KYC submission was rejected. ${dto.rejectReason || ''}`.trim()
            : 'Your KYC submission is currently under review.',
      data: {
        kycSubmissionId: id,
        status: dto.status,
      },
    });

    return this.getByIdForAdmin(id, role);
  }
}
