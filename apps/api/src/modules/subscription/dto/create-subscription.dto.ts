import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  planId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  successUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelUrl?: string;
}
