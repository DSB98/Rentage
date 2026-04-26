import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { KycDocType } from '@rentage/shared-types';

class KycDocumentInputDto {
  @IsEnum(KycDocType)
  type!: KycDocType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  number?: string;

  @IsUrl({ require_tld: false })
  fileUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  filePublicId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SubmitKycDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KycDocumentInputDto)
  documents!: KycDocumentInputDto[];
}
