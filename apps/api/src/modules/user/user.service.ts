import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, subscription: { include: { plan: true } } },
    });

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, emailVerificationToken, passwordResetToken, passwordResetExpiry, ...sanitized } = user;
    return sanitized;
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string; bio?: string; city?: string; state?: string }) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, fullName: data.fullName || 'User', ...data },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl },
    });
  }
}
