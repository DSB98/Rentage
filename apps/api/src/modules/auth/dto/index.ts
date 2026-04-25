import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ enum: ['OWNER', 'RENTER'] })
  @IsEnum(['OWNER', 'RENTER'])
  role: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+91[0-9]{10}$/, { message: 'Invalid Indian phone number (use +91XXXXXXXXXX)' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+91[0-9]{10}$/)
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  code: string;

  @ApiPropertyOptional({ enum: ['OWNER', 'RENTER'] })
  @IsOptional()
  @IsEnum(['OWNER', 'RENTER'])
  role?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
