import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      bio?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
      gender?: string;
      avatarUrl?: string;
      dob?: string | null;
    },
  ) {
    let parsedDob: Date | null | undefined = undefined;
    if (data.dob === null) {
      parsedDob = null;
    } else if (typeof data.dob === 'string' && data.dob.trim()) {
      const maybeDate = new Date(data.dob);
      if (Number.isNaN(maybeDate.getTime())) {
        throw new BadRequestException('Invalid dob format');
      }
      parsedDob = maybeDate;
    }

    const { dob, ...rest } = data;
    const profileData = {
      ...rest,
      ...(parsedDob !== undefined ? { dob: parsedDob } : {}),
    };

    return this.prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, fullName: data.fullName || 'User', ...profileData },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl },
    });
  }
}
