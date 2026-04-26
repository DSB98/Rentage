import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { KycStatus } from '@rentage/shared-types';

export class ReviewKycDto {
  @IsEnum(KycStatus)
  status!: KycStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectReason?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
