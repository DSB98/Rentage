import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import ms, { StringValue } from 'ms';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '@rentage/shared-types';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  // ─── REGISTER ──────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerificationToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role as UserRole,
        emailVerificationToken,
        profile: {
          create: {
            fullName: dto.fullName,
          },
        },
      },
      include: { profile: true },
    });

    // TODO: Send verification email with emailVerificationToken
    await this.notifications.sendEmailVerification(
      user.id,
      user.email,
      user.profile?.fullName || dto.fullName || '',
      emailVerificationToken,
    );

    const tokens = await this.generateTokens(user.id, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  // ─── LOGIN ─────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  // ─── VERIFY EMAIL ──────────────────────────────────

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerificationToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  // ─── FORGOT / RESET PASSWORD ──────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If an account exists, a reset email has been sent' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry },
    });

    // TODO: Send reset email with resetToken
    const profile = await this.prisma.userProfile.findUnique({ where: { userId: user.id } });
    await this.notifications.sendPasswordReset(user.email, profile?.fullName || '', resetToken);

    return { message: 'If an account exists, a reset email has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    // Invalidate all refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { message: 'Password reset successfully' };
  }

  // ─── GOOGLE OAUTH ─────────────────────────────────

  async googleLogin(googleUser: { email: string; firstName: string; lastName: string; googleId: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { profile: true, oauthAccounts: true },
    });

    if (!user) {
      // Create new user from Google
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          role: UserRole.RENTER, // Default for OAuth, can be changed
          isEmailVerified: true,
          profile: {
            create: {
              fullName: `${googleUser.firstName} ${googleUser.lastName}`.trim(),
            },
          },
          oauthAccounts: {
            create: {
              provider: 'google',
              providerAccountId: googleUser.googleId,
            },
          },
        },
        include: { profile: true, oauthAccounts: true },
      });
    } else {
      // Link Google account if not already linked
      const hasGoogle = user.oauthAccounts?.some((a) => a.provider === 'google');
      if (!hasGoogle) {
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: googleUser.googleId,
          },
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  // ─── PHONE OTP ─────────────────────────────────────

  async sendOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // OTP expires in 5 minutes — expiry logic to be used when integrating Twilio/MSG91

    // Store OTP (upsert based on phone in a separate OTP table or cache)
    // For now, using a simple approach with OAuthAccount
    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    // Store in memory/cache for verification
    await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'phone_otp',
          providerAccountId: phone,
        },
      },
      update: {
        providerAccountId: phone,
      },
      create: {
        userId: (await this.getOrCreatePhoneUser(phone)).id,
        provider: 'phone_otp',
        providerAccountId: phone,
      },
    });

    await this.notifications.sendOtpSms(phone, otp);

    return { message: 'OTP sent successfully', expiresIn: 300 };
  }

  async verifyOtp(phone: string, code: string, role?: string) {
    // TODO: Verify with Twilio/MSG91
    // For development, accept any 6-digit code
    if (code.length !== 6) {
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.getOrCreatePhoneUser(phone, role as UserRole);

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  private async getOrCreatePhoneUser(phone: string, role?: UserRole) {
    // Find user by phone in profile
    const profile = await this.prisma.userProfile.findFirst({
      where: { phone },
      include: { user: { include: { profile: true } } },
    });

    if (profile) {
      return profile.user;
    }

    // Create new user with phone
    return this.prisma.user.create({
      data: {
        email: `${phone.replace('+', '')}@phone.rentage.in`,
        role: role || UserRole.RENTER,
        isEmailVerified: false,
        profile: {
          create: {
            fullName: 'User',
            phone,
          },
        },
      },
      include: { profile: true },
    });
  }

  // ─── TOKEN MANAGEMENT ─────────────────────────────

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { profile: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // If token was found but expired, delete it
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = await this.generateTokens(stored.user.id, stored.user.role);
    return { user: this.sanitizeUser(stored.user), tokens };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
    } else {
      // Logout from all devices
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return { message: 'Logged out successfully' };
  }

  // ─── HELPERS ──────────────────────────────────────

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = randomBytes(40).toString('hex');
    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d') as StringValue;
    const expiresAt = new Date(Date.now() + ms(refreshExpiry));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
  }

  // ─── OAUTH EXCHANGE CODE ──────────────────────────
  // One-time, short-lived code used to swap server-side OAuth result for tokens
  // without leaking JWTs through redirect URLs.
  private exchangeCodes = new Map<string, { tokens: any; user: any; expiresAt: number }>();

  issueExchangeCode(payload: { tokens: any; user: any }): string {
    const code = randomBytes(24).toString('hex');
    this.exchangeCodes.set(code, {
      ...payload,
      expiresAt: Date.now() + 60_000, // 60 s
    });
    // Opportunistic cleanup
    for (const [key, entry] of this.exchangeCodes) {
      if (entry.expiresAt < Date.now()) this.exchangeCodes.delete(key);
    }
    return code;
  }

  consumeExchangeCode(code: string) {
    const entry = this.exchangeCodes.get(code);
    if (!entry || entry.expiresAt < Date.now()) {
      this.exchangeCodes.delete(code);
      throw new UnauthorizedException('Invalid or expired exchange code');
    }
    this.exchangeCodes.delete(code);
    return { tokens: entry.tokens, user: entry.user };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, emailVerificationToken, passwordResetToken, passwordResetExpiry, oauthAccounts, ...sanitized } = user;
    return sanitized;
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return this.sanitizeUser(user);
  }
}
