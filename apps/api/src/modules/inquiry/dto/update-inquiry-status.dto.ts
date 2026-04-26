import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InquiryStatus } from '@rentage/shared-types';

export class UpdateInquiryStatusDto {
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
