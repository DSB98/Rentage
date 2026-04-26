import { IsOptional, IsUUID } from 'class-validator';

export class AssignInquiryDto {
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
