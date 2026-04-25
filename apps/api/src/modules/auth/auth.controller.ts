import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, SendOtpDto, VerifyOtpDto, RefreshTokenDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register with email and password' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  // ─── GOOGLE OAUTH ─────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user as any);

    // Set refresh token in httpOnly cookie (never exposed to JS)
    this.setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshExpiresAt);

    // Issue a short-lived, one-time exchange code; the SPA exchanges it for the access token.
    const code = this.authService.issueExchangeCode({
      tokens: { accessToken: result.tokens.accessToken },
      user: result.user,
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const params = new URLSearchParams({ code });
    res.redirect(`${appUrl}/auth/callback?${params.toString()}`);
  }

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange short-lived OAuth code for access token' })
  async oauthExchange(@Body() body: { code: string }) {
    return this.authService.consumeExchangeCode(body.code);
  }

  // ─── PHONE OTP ────────────────────────────────────

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login/register' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code, dto.role);
  }

  // ─── TOKEN MANAGEMENT ─────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (invalidate refresh token)' })
  async logout(@CurrentUser('id') userId: string, @Body() body: { refreshToken?: string }) {
    return this.authService.logout(userId, body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  // ─── COOKIE HELPERS ──────────────────────────────
  private setRefreshCookie(res: Response, token: string, expiresAt?: Date) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('rentage_refresh', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      path: '/api/v1/auth',
      expires: expiresAt,
    });
  }
}
